from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from equipment.models import Category, Equipment
from fines.models import Fine
from maintenance.models import MaintenanceLog
from rentals.models import AuditLog, RentalRequest
from users.models import User


class RentalWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='lab-admin',
            password='test-password',
            role='admin',
        )
        self.student = User.objects.create_user(
            username='student-one',
            password='test-password',
            role='student',
            enrollment_no='ENR-1001',
            first_name='Test',
            last_name='Student',
            email='student@example.test',
            phone='1234567890',
            class_division='Test Class',
        )
        self.other_student = User.objects.create_user(
            username='student-two',
            password='test-password',
            role='student',
            enrollment_no='ENR-1002',
        )
        self.category = Category.objects.create(name='Test Instruments')
        self.equipment = Equipment.objects.create(
            name='Test Oscilloscope',
            category=self.category,
            lab_location='Test Lab',
            description='Equipment used by workflow tests.',
            total_qty=10,
            max_rental_days=7,
            late_fine_per_day=25,
        )
        self.code_counter = 0

    def make_code(self):
        self.code_counter += 1
        return f'LRX-{self.code_counter:05d}'

    def make_rental(self, student=None, equipment=None, status='pending', **kwargs):
        student = student or self.student
        equipment = equipment or self.equipment
        today = timezone.localdate()
        values = {
            'student': student,
            'equipment': equipment,
            'num_days': 2,
            'start_date': today,
            'return_date': today + timedelta(days=2),
            'reason': 'Course laboratory experiment.',
            'full_name': student.get_full_name(),
            'enrollment_no': student.enrollment_no,
            'email': student.email,
            'phone': student.phone,
            'class_division': student.class_division,
            'declaration_accepted': True,
            'status': status,
        }
        values.update(kwargs)
        return RentalRequest.objects.create(**values)

    def request_payload(self, **overrides):
        start = timezone.localdate()
        payload = {
            'equipment': self.equipment.pk,
            'num_days': 2,
            'start_date': start.isoformat(),
            'return_date': (start + timedelta(days=2)).isoformat(),
            'reason': 'Course laboratory experiment.',
            'full_name': 'Forged Name',
            'enrollment_no': 'FORGED-9999',
            'email': 'forged@example.test',
            'phone': '0000000000',
            'class_division': 'Forged Class',
            'declaration_accepted': True,
        }
        payload.update(overrides)
        return payload

    def as_admin(self):
        self.client.force_authenticate(user=self.admin)

    def as_student(self, student=None):
        self.client.force_authenticate(user=student or self.student)

    def test_login_accepts_registered_enrollment_number(self):
        response = self.client.post('/api/auth/login/', {
            'username': ' enr-1001 ',
            'password': 'test-password',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['id'], self.student.pk)

    def test_admin_login_returns_admin_role(self):
        response = self.client.post('/api/auth/login/', {
            'username': 'lab-admin',
            'password': 'test-password',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'admin')

    def test_request_limit_and_profile_snapshot_are_server_controlled(self):
        self.as_student()
        for _ in range(3):
            response = self.client.post(
                '/api/requests/',
                self.request_payload(),
                format='json',
            )
            self.assertEqual(response.status_code, 201)

        latest = RentalRequest.objects.order_by('-pk').first()
        self.assertEqual(latest.full_name, self.student.get_full_name())
        self.assertEqual(latest.enrollment_no, self.student.enrollment_no)
        self.assertEqual(latest.email, self.student.email)

        response = self.client.post(
            '/api/requests/',
            self.request_payload(),
            format='json',
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.student.rental_requests.count(), 3)

    def test_unpaid_fine_blocks_a_new_request(self):
        rental = self.make_rental(status='returned')
        Fine.objects.create(
            rental_request=rental,
            student=self.student,
            days_late=1,
            amount=25,
        )
        self.as_student()

        response = self.client.post(
            '/api/requests/',
            self.request_payload(),
            format='json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.student.rental_requests.count(), 1)

    def test_students_cannot_read_another_students_request_or_admin_queue(self):
        rental = self.make_rental(student=self.other_student)
        self.as_student()

        private_response = self.client.get(f'/api/requests/mine/{rental.pk}/')
        admin_response = self.client.get('/api/requests/all/')

        self.assertEqual(private_response.status_code, 404)
        self.assertEqual(admin_response.status_code, 403)

    def test_student_cannot_fetch_hidden_equipment_by_id(self):
        self.equipment.is_available = False
        self.equipment.save(update_fields=['is_available'])
        self.as_student()

        response = self.client.get(f'/api/equipment/{self.equipment.pk}/')

        self.assertEqual(response.status_code, 404)

    def test_approval_reserves_the_last_unit(self):
        self.equipment.total_qty = 1
        self.equipment.save(update_fields=['total_qty'])
        first = self.make_rental(student=self.student)
        second = self.make_rental(student=self.other_student)
        self.as_admin()

        first_response = self.client.post(
            f'/api/requests/{first.pk}/decide/',
            {'action': 'approve'},
            format='json',
        )
        second_response = self.client.post(
            f'/api/requests/{second.pk}/decide/',
            {'action': 'approve'},
            format='json',
        )

        self.assertEqual(first_response.status_code, 200)
        self.assertRegex(first_response.data['reservation_code'], r'^LRX-\d{5}$')
        self.assertEqual(second_response.status_code, 400)
        self.assertEqual(self.equipment.available_qty, 0)

    def test_issue_uses_registered_enrollment_and_code_cannot_repeat(self):
        rental = self.make_rental(
            status='approved',
            reservation_code=self.make_code(),
            enrollment_no='OUTDATED-SNAPSHOT',
        )
        self.as_admin()

        wrong_enrollment = self.client.post(
            f'/api/requests/{rental.pk}/issue/',
            {
                'enrollment_no': 'OUTDATED-SNAPSHOT',
                'reservation_code': rental.reservation_code,
            },
            format='json',
        )
        issued = self.client.post(
            f'/api/requests/{rental.pk}/issue/',
            {
                'enrollment_no': self.student.enrollment_no,
                'reservation_code': rental.reservation_code,
            },
            format='json',
        )
        repeated_issue = self.client.post(
            f'/api/requests/{rental.pk}/issue/',
            {
                'enrollment_no': self.student.enrollment_no,
                'reservation_code': rental.reservation_code,
            },
            format='json',
        )

        self.assertEqual(wrong_enrollment.status_code, 400)
        self.assertEqual(issued.status_code, 200)
        self.assertEqual(repeated_issue.status_code, 400)
        rental.refresh_from_db()
        self.assertEqual(rental.status, 'issued')

    def test_return_calculates_fine_and_damaged_stock_is_maintenance(self):
        rental = self.make_rental(
            status='issued',
            reservation_code=self.make_code(),
            issued_at=timezone.now() - timedelta(days=5),
        )
        self.equipment.total_qty = 2
        self.equipment.save(update_fields=['total_qty'])
        self.as_admin()

        response = self.client.post(
            f'/api/requests/{rental.pk}/return/',
            {
                'reservation_code': rental.reservation_code,
                'condition': 'damaged',
                'damage_notes': 'Broken connector.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['days_late'], 3)
        self.assertEqual(response.data['fine_amount'], '75.00')
        rental.refresh_from_db()
        self.equipment.refresh_from_db()
        self.assertEqual(rental.status, 'returned')
        self.assertEqual(rental.fines.get().amount, 75)
        self.assertEqual(self.equipment.under_maintenance_qty, 1)
        self.assertEqual(self.equipment.available_qty, 1)
        self.assertEqual(MaintenanceLog.objects.filter(related_request=rental).count(), 1)
        self.assertTrue(AuditLog.objects.filter(action='equipment_returned').exists())

        repeated_return = self.client.post(
            f'/api/requests/{rental.pk}/return/',
            {
                'reservation_code': rental.reservation_code,
                'condition': 'good',
            },
            format='json',
        )
        self.assertEqual(repeated_return.status_code, 400)

    def test_maintenance_quantity_is_bounded_and_resolution_restores_stock(self):
        self.equipment.total_qty = 2
        self.equipment.save(update_fields=['total_qty'])
        self.as_admin()

        created = self.client.post(
            '/api/maintenance/',
            {
                'equipment': self.equipment.pk,
                'log_type': 'repair',
                'notes': 'Two units require inspection.',
                'quantity_affected': 2,
            },
            format='json',
        )
        over_allocated = self.client.post(
            '/api/maintenance/',
            {
                'equipment': self.equipment.pk,
                'log_type': 'repair',
                'notes': 'This exceeds stock.',
                'quantity_affected': 1,
            },
            format='json',
        )
        self.assertEqual(created.status_code, 201)
        self.assertEqual(over_allocated.status_code, 400)

        log = MaintenanceLog.objects.get(equipment=self.equipment)
        resolved = self.client.post(
            f'/api/maintenance/{log.pk}/resolve/',
            format='json',
        )
        self.equipment.refresh_from_db()
        self.assertEqual(resolved.status_code, 200)
        self.assertEqual(self.equipment.under_maintenance_qty, 0)
        self.assertEqual(self.equipment.available_qty, 2)

    def test_fine_payment_and_waiver_require_unpaid_state_and_justification(self):
        paid_rental = self.make_rental(status='returned')
        paid_fine = Fine.objects.create(
            rental_request=paid_rental,
            student=self.student,
            days_late=1,
            amount=25,
        )
        waived_rental = self.make_rental(status='returned', student=self.other_student)
        waived_fine = Fine.objects.create(
            rental_request=waived_rental,
            student=self.other_student,
            days_late=2,
            amount=50,
        )
        self.as_admin()

        paid = self.client.post(f'/api/fines/{paid_fine.pk}/mark-paid/', format='json')
        waived_without_reason = self.client.post(
            f'/api/fines/{waived_fine.pk}/waive/',
            {'reason': '     '},
            format='json',
        )
        waived = self.client.post(
            f'/api/fines/{waived_fine.pk}/waive/',
            {'reason': 'Approved after review.'},
            format='json',
        )
        repeat_waiver = self.client.post(
            f'/api/fines/{waived_fine.pk}/waive/',
            {'reason': 'A second waiver attempt.'},
            format='json',
        )

        self.assertEqual(paid.status_code, 200)
        self.assertEqual(waived_without_reason.status_code, 400)
        self.assertEqual(waived.status_code, 200)
        self.assertEqual(repeat_waiver.status_code, 400)
        waived_fine.refresh_from_db()
        self.assertEqual(waived_fine.status, 'waived')
        self.assertEqual(waived_fine.waiver_reason, 'Approved after review.')
        self.assertEqual(waived_fine.waived_by, self.admin)

    def test_rental_and_audit_csv_exports_require_admin_authentication(self):
        self.client.force_authenticate(user=self.student)
        denied = self.client.get('/api/reports/export/audit/')
        self.assertEqual(denied.status_code, 403)

        self.as_admin()
        rentals = self.client.get('/api/reports/export/rentals/')
        audit = self.client.get('/api/reports/export/audit/')
        self.assertEqual(rentals.status_code, 200)
        self.assertEqual(audit.status_code, 200)
        self.assertIn('text/csv', rentals['Content-Type'])
        self.assertIn('text/csv', audit['Content-Type'])

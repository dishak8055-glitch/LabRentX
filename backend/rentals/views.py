
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.utils import timezone
from django.db import IntegrityError, transaction
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import RentalRequest, AuditLog
from .serializers import (
    RentalRequestCreateSerializer,
    RentalRequestListSerializer,
    RentalRequestDetailSerializer,
    ApproveRejectSerializer,
    IssueSerializer,
    ReturnSerializer,
    LookupSerializer,
    AuditLogSerializer,
)
from fines.models import Fine
from equipment.models import Equipment
from maintenance.models import MaintenanceLog
from notifications.services import notify_admins, notify_user
from users.models import User
from users.views import IsAdmin, IsStudent


def log_action(actor, action, target_type, target_id, details=''):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details,
    )


class StudentRequestCreateView(generics.CreateAPIView):
    """Student creates a rental request."""
    serializer_class = RentalRequestCreateSerializer
    permission_classes = [IsStudent]

    @transaction.atomic
    def perform_create(self, serializer):
        student = User.objects.select_for_update().get(pk=self.request.user.pk)
        equipment = Equipment.objects.select_for_update().get(
            pk=serializer.validated_data['equipment'].pk
        )
        max_requests = settings.LABRENTX.get('MAX_ACTIVE_REQUESTS_PER_STUDENT', 3)
        if student.has_unpaid_fines:
            raise ValidationError(
                'You have unpaid fines. Please clear them before submitting a new request.'
            )
        if student.active_request_count >= max_requests:
            raise ValidationError(
                f'You cannot have more than {max_requests} active requests at a time.'
            )
        if not equipment.is_available or equipment.available_qty < 1:
            raise ValidationError('This equipment is currently unavailable.')

        request_obj = serializer.save(student=student, equipment=equipment)
        log_action(
            self.request.user,
            'request_created',
            'RentalRequest',
            request_obj.pk,
            f'Equipment: {request_obj.equipment.name}',
        )
        notify_admins(
            'request_submitted',
            f'{student.get_full_name()} submitted a request for {equipment.name}.',
            '/requests',
        )


class StudentRequestListView(generics.ListAPIView):
    """Student views their own requests."""
    serializer_class = RentalRequestListSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        qs = RentalRequest.objects.filter(
            student=self.request.user
        ).select_related('equipment', 'student')

        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs


class StudentRequestDetailView(generics.RetrieveAPIView):
    serializer_class = RentalRequestDetailSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return RentalRequest.objects.filter(
            student=self.request.user
        ).select_related('equipment', 'student')


class StudentCancelView(APIView):
    """Student cancels a pending or approved request."""

    permission_classes = [IsStudent]

    @transaction.atomic
    def post(self, request, pk):
        try:
            rental = RentalRequest.objects.select_for_update().get(
                pk=pk,
                student=request.user,
            )
        except RentalRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if rental.status not in ('pending', 'approved'):
            return Response(
                {'error': 'Only pending or approved requests can be cancelled.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rental.status = 'cancelled'
        rental.save()

        log_action(
            request.user,
            'request_cancelled',
            'RentalRequest',
            rental.pk,
        )
        notify_user(
            request.user,
            'general',
            f'Your request for {rental.equipment.name} was cancelled.',
            '/requests',
        )

        return Response({'message': 'Request cancelled successfully.'})


# ---------- Admin views ----------

class AdminRequestListView(generics.ListAPIView):
    """Admin views all requests with filters."""
    serializer_class = RentalRequestListSerializer
    permission_classes = [IsAdmin]

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_fields = [
        'status',
        'is_overdue',
        'equipment__category',
    ]

    search_fields = [
        'reservation_code',
        'enrollment_no',
        'full_name',
        'equipment__name',
        'equipment__equipment_id',
    ]

    ordering_fields = [
        'created_at',
        'start_date',
        'return_date',
    ]

    ordering = ['-created_at']

    def get_queryset(self):
        return RentalRequest.objects.select_related(
            'equipment',
            'student',
        ).all()


class AdminRequestDetailView(generics.RetrieveAPIView):
    serializer_class = RentalRequestDetailSerializer
    permission_classes = [IsAdmin]

    queryset = RentalRequest.objects.select_related(
        'equipment',
        'student',
    )


class ApproveRejectView(APIView):
    """Admin approves or rejects a request."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        serializer = ApproveRejectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            rental = RentalRequest.objects.select_for_update().select_related(
                'student'
            ).get(pk=pk)
        except RentalRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if rental.status != 'pending':
            return Response(
                {'error': 'Only pending requests can be approved or rejected.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        action = serializer.validated_data['action']

        if action == 'approve':
            equipment = Equipment.objects.select_for_update().get(
                pk=rental.equipment_id
            )
            if not equipment.is_available or equipment.available_qty < 1:
                return Response(
                    {'error': 'Equipment is no longer available.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            rental.status = 'approved'
            rental.decided_by = request.user
            rental.decided_at = timezone.now()
            for _ in range(10):
                rental.reservation_code = RentalRequest.generate_reservation_code()
                try:
                    with transaction.atomic():
                        rental.save()
                    break
                except IntegrityError:
                    continue
            else:
                return Response(
                    {'error': 'Could not generate a unique reservation code. Please retry.'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            log_action(
                request.user,
                'request_approved',
                'RentalRequest',
                rental.pk,
                f'Code: {rental.reservation_code}',
            )
            notify_user(
                rental.student,
                'request_approved',
                f'Your request for {equipment.name} was approved. Reservation code: {rental.reservation_code}.',
                '/requests',
            )

            return Response({
                'message': 'Request approved.',
                'reservation_code': rental.reservation_code,
            })

        rental.status = 'rejected'
        rental.admin_remark = serializer.validated_data.get(
            'remark', ''
        )
        rental.decided_by = request.user
        rental.decided_at = timezone.now()
        rental.save()

        log_action(
            request.user,
            'request_rejected',
            'RentalRequest',
            rental.pk,
            f'Remark: {rental.admin_remark}',
        )
        notify_user(
            rental.student,
            'request_rejected',
            f'Your request for {rental.equipment.name} was rejected. {rental.admin_remark}',
            '/requests',
        )

        return Response({'message': 'Request rejected.'})


class LookupView(APIView):
    """Admin looks up a request by reservation code."""
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = LookupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['reservation_code']

        try:
            rental = RentalRequest.objects.filter(
                status__in=['approved', 'issued'],
            ).select_related(
                'equipment',
                'student',
            ).get(reservation_code__iexact=code)

        except RentalRequest.DoesNotExist:
            return Response(
                {'error': 'No request found with this reservation code.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            RentalRequestDetailSerializer(rental).data
        )


class IssueView(APIView):
    """Admin marks a request as issued after verifying enrollment number."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            rental = RentalRequest.objects.select_for_update().select_related(
                'student',
            ).get(pk=pk)

        except RentalRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if rental.status != 'approved':
            return Response(
                {'error': 'Only approved requests can be issued.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = IssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        enrollment_no = serializer.validated_data['enrollment_no'].strip()
        registered_enrollment = (rental.student.enrollment_no or '').strip()
        reservation_code = serializer.validated_data['reservation_code'].strip().upper()
        if not registered_enrollment or enrollment_no.casefold() != registered_enrollment.casefold():
            return Response(
                {'error': 'Enrollment number does not match.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if reservation_code != rental.reservation_code:
            return Response(
                {'error': 'Reservation code does not match this request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        equipment = Equipment.objects.select_for_update().get(
            pk=rental.equipment_id
        )
        rental.status = 'issued'
        rental.issued_at = timezone.now()
        rental.save()

        log_action(
            request.user,
            'equipment_issued',
            'RentalRequest',
            rental.pk,
            f'Equipment: {rental.equipment.name}, '
            f'Student: {rental.enrollment_no}',
        )
        notify_user(
            rental.student,
            'equipment_issued',
            f'{equipment.name} was issued to you. Please return it by {rental.due_date}.',
            '/requests',
        )

        return Response({
            'message': 'Equipment issued successfully.',
            'due_date': rental.due_date,
        })


class ReturnView(APIView):
    """Admin marks equipment as returned and calculates late fine."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):

        try:
            rental = RentalRequest.objects.select_for_update().select_related(
                'student',
            ).get(pk=pk)

        except RentalRequest.DoesNotExist:
            return Response(
                {'error': 'Request not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        if rental.status != 'issued':
            return Response(
                {'error': 'Only issued equipment can be returned.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ReturnSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reservation_code = serializer.validated_data['reservation_code'].strip().upper()
        if reservation_code != rental.reservation_code:
            return Response(
                {'error': 'Reservation code does not match this request.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        equipment = Equipment.objects.select_for_update().get(
            pk=rental.equipment_id
        )

        rental.status = 'returned'
        rental.actual_return_date = timezone.now()
        rental.return_condition = serializer.validated_data['condition']
        rental.damage_notes = serializer.validated_data.get(
            'damage_notes', ''
        )
        rental.is_overdue = False
        rental.save()

        # Calculate late fine
        days_late = rental.days_late
        fine_amount = 0

        if days_late > 0:
            fine_amount = days_late * equipment.late_fine_per_day

            Fine.objects.create(
                rental_request=rental,
                student=rental.student,
                days_late=days_late,
                amount=fine_amount,
            )
            notify_user(
                rental.student,
                'fine_added',
                f'A fine of ₹{fine_amount} was recorded for {days_late} late day(s).',
                '/fines',
            )

        # Handle damaged equipment
        if serializer.validated_data['condition'] == 'damaged':
            MaintenanceLog.objects.create(
                equipment=equipment,
                log_type='damage',
                notes=rental.damage_notes,
                quantity_affected=1,
                logged_by=request.user,
                related_request=rental,
            )
            equipment.under_maintenance_qty += 1
            equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])

        # Record return in audit trail
        log_action(
            request.user,
            'equipment_returned',
            'RentalRequest',
            rental.pk,
            f'Condition: {rental.return_condition}, '
            f'Fine: ₹{fine_amount}',
        )
        notify_user(
            rental.student,
            'equipment_returned',
            f'{equipment.name} was returned and checked in.',
            '/requests',
        )

        return Response({
            'message': 'Equipment returned successfully.',
            'days_late': days_late,
            'fine_amount': str(fine_amount),
            'condition': rental.return_condition,
        })


class AuditLogListView(generics.ListAPIView):
    """Admin views the audit log."""
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    queryset = AuditLog.objects.select_related(
        'actor'
    ).all()

    filter_backends = [
        SearchFilter,
        OrderingFilter,
    ]

    search_fields = [
        'action',
        'target_type',
        'details',
    ]

    ordering = ['-timestamp']

import csv
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from django.db.models import Count, Q
from rentals.models import RentalRequest
from equipment.models import Equipment
from .models import AuditLog
from users.views import IsAdmin


def safe_csv_cell(value):
    value = '' if value is None else str(value)
    if value.startswith(('=', '+', '-', '@', '\t', '\r')):
        return f"'{value}"
    return value


class UsageReportView(APIView):
    """Equipment usage statistics."""
    permission_classes = [IsAdmin]

    def get(self, request):
        equipment_stats = list(Equipment.objects.annotate(
            total_requests=Count('rental_requests'),
            active_rentals=Count('rental_requests', filter=Q(rental_requests__status='issued')),
            completed_rentals=Count('rental_requests', filter=Q(rental_requests__status='returned')),
        ).values(
            'id', 'equipment_id', 'name', 'category__name',
            'total_qty', 'total_requests', 'active_rentals', 'completed_rentals',
        ).order_by('-total_requests'))

        turnaround_totals = defaultdict(lambda: [0.0, 0])
        returned = RentalRequest.objects.filter(
            status='returned',
            issued_at__isnull=False,
            actual_return_date__isnull=False,
        ).values_list('equipment_id', 'issued_at', 'actual_return_date')
        for equipment_id, issued_at, returned_at in returned:
            duration_days = (returned_at - issued_at).total_seconds() / 86400
            total, count = turnaround_totals[equipment_id]
            turnaround_totals[equipment_id] = [total + duration_days, count + 1]

        for item in equipment_stats:
            total, count = turnaround_totals[item['id']]
            item['average_turnaround_days'] = round(total / count, 2) if count else None

        return Response(equipment_stats)


class OverdueReportView(APIView):
    """Currently overdue items."""
    permission_classes = [IsAdmin]

    def get(self, request):
        overdue = [
            request
            for request in RentalRequest.objects.filter(
                status='issued',
            ).select_related('equipment', 'student')
            if request.days_late > 0
        ]
        overdue_ids = [request.pk for request in overdue]
        RentalRequest.objects.filter(
            status='issued',
            is_overdue=True,
        ).exclude(pk__in=overdue_ids).update(is_overdue=False)
        RentalRequest.objects.filter(
            pk__in=overdue_ids,
            is_overdue=False,
        ).update(is_overdue=True)

        from rentals.serializers import RentalRequestListSerializer
        return Response(RentalRequestListSerializer(overdue, many=True).data)


class InventoryReportView(APIView):
    """Full inventory status."""
    permission_classes = [IsAdmin]

    def get(self, request):
        equipment = Equipment.objects.select_related('category').all()
        data = []
        for eq in equipment:
            data.append({
                'id': eq.id,
                'equipment_id': eq.equipment_id,
                'name': eq.name,
                'category': eq.category.name,
                'brand': eq.brand,
                'model_number': eq.model_number,
                'lab_location': eq.lab_location,
                'total_qty': eq.total_qty,
                'available_qty': eq.available_qty,
                'issued_qty': eq.issued_qty,
                'reserved_qty': eq.reserved_qty,
                'under_maintenance': eq.under_maintenance_qty,
                'unit_value': str(eq.unit_value),
                'inventory_value': str(eq.unit_value * eq.total_qty),
                'condition': eq.condition,
                'is_available': eq.is_available,
                'is_low_stock': eq.is_low_stock,
            })
        return Response(data)


class ExportRentalsCSVView(APIView):
    """Export rental history as CSV."""
    permission_classes = [IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="rental_history.csv"'
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Reservation Code', 'Student', 'Enrollment No',
            'Equipment', 'Start Date', 'Return Date', 'Status',
            'Issued At', 'Returned At', 'Days Late', 'Fine Amount',
        ])
        rentals = RentalRequest.objects.select_related(
            'equipment', 'student'
        ).prefetch_related('fines').order_by('-created_at')

        for r in rentals:
            fine = next(iter(r.fines.all()), None)
            writer.writerow(map(safe_csv_cell, [
                r.pk, r.reservation_code or '', r.full_name, r.enrollment_no,
                r.equipment.name, r.start_date, r.return_date, r.status,
                r.issued_at or '', r.actual_return_date or '',
                r.days_late, str(fine.amount) if fine else '0',
            ]))
        return response


class ExportAuditCSVView(APIView):
    """Export the audit ledger as CSV."""
    permission_classes = [IsAdmin]

    def get(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_ledger.csv"'
        writer = csv.writer(response)
        writer.writerow(['Timestamp', 'Actor', 'Action', 'Target Type', 'Target ID', 'Details'])

        logs = AuditLog.objects.select_related('actor').order_by('-timestamp')
        for log in logs.iterator():
            actor = (
                log.actor.get_full_name() or log.actor.username
                if log.actor else ''
            )
            writer.writerow(map(safe_csv_cell, [
                log.timestamp,
                actor,
                log.action,
                log.target_type,
                log.target_id,
                log.details,
            ]))
        return response

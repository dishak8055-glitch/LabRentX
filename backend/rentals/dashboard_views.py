from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Sum
from rentals.models import RentalRequest
from equipment.models import Equipment
from fines.models import Fine
from users.models import User
from users.views import IsAdmin


class DashboardSummaryView(APIView):
    """Admin dashboard summary stats."""
    permission_classes = [IsAdmin]

    def get(self, request):
        pending_count = RentalRequest.objects.filter(status='pending').count()
        issued_count = RentalRequest.objects.filter(status='issued').count()
        issued_requests = RentalRequest.objects.filter(
            status='issued'
        ).select_related('equipment')
        overdue_ids = [
            request.pk for request in issued_requests
            if request.days_late > 0
        ]
        overdue_count = len(overdue_ids)
        RentalRequest.objects.filter(
            status='issued',
            is_overdue=True,
        ).exclude(pk__in=overdue_ids).update(is_overdue=False)
        RentalRequest.objects.filter(
            pk__in=overdue_ids,
            is_overdue=False,
        ).update(is_overdue=True)

        # Low stock equipment
        low_stock = []
        for eq in Equipment.objects.filter(is_available=True):
            if eq.is_low_stock:
                low_stock.append({
                    'id': eq.id,
                    'equipment_id': eq.equipment_id,
                    'name': eq.name,
                    'available_qty': eq.available_qty,
                    'total_qty': eq.total_qty,
                })

        # Recent requests
        recent_requests = RentalRequest.objects.select_related(
            'equipment', 'student'
        ).order_by('-created_at')[:5]

        from rentals.serializers import RentalRequestListSerializer
        recent_data = RentalRequestListSerializer(recent_requests, many=True).data

        # Stats
        total_students = User.objects.filter(role='student').count()
        total_equipment = Equipment.objects.count()
        total_inventory_value = sum(
            (item.unit_value * item.total_qty for item in Equipment.objects.only(
                'unit_value', 'total_qty'
            )),
            start=0,
        )
        total_rentals = RentalRequest.objects.filter(
            status__in=['issued', 'returned']
        ).count()
        unpaid_fines_total = Fine.objects.filter(
            status='unpaid'
        ).aggregate(total=Sum('amount'))['total'] or 0

        # Most requested equipment
        most_requested = Equipment.objects.annotate(
            request_count=Count('rental_requests')
        ).order_by('-request_count')[:5].values(
            'id', 'equipment_id', 'name', 'request_count'
        )

        return Response({
            'pending_requests': pending_count,
            'issued_items': issued_count,
            'overdue_items': overdue_count,
            'low_stock_items': low_stock,
            'recent_requests': recent_data,
            'total_students': total_students,
            'total_equipment': total_equipment,
            'total_inventory_value': str(total_inventory_value),
            'total_rentals': total_rentals,
            'unpaid_fines_total': str(unpaid_fines_total),
            'most_requested': list(most_requested),
        })

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import MaintenanceLog
from .serializers import MaintenanceLogSerializer, MaintenanceLogCreateSerializer
from equipment.models import Equipment
from rentals.views import log_action
from users.views import IsAdmin


class MaintenanceLogListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = MaintenanceLog.objects.select_related(
        'equipment', 'logged_by', 'resolved_by'
    ).all()
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['log_type', 'status', 'equipment']
    search_fields = ['equipment__name', 'notes']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MaintenanceLogCreateSerializer
        return MaintenanceLogSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        equipment = Equipment.objects.select_for_update().get(
            pk=serializer.validated_data['equipment'].pk
        )
        quantity = serializer.validated_data['quantity_affected']
        if quantity > equipment.available_qty:
            raise ValidationError({
                'quantity_affected': 'Affected quantity cannot exceed currently available stock.'
            })

        log = serializer.save(
            logged_by=self.request.user,
            equipment=equipment,
        )
        equipment.under_maintenance_qty += quantity
        equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])
        log_action(
            self.request.user,
            'maintenance_logged',
            'MaintenanceLog',
            log.pk,
            f'{quantity} unit(s) of {equipment.name} removed from availability.',
        )


class MaintenanceLogDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAdmin]
    queryset = MaintenanceLog.objects.select_related('equipment', 'logged_by', 'resolved_by')
    serializer_class = MaintenanceLogSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        log = MaintenanceLog.objects.select_for_update().get(
            pk=serializer.instance.pk
        )
        old_equipment_id = log.equipment_id
        old_quantity = log.quantity_affected
        new_equipment = serializer.validated_data.get('equipment', log.equipment)
        new_quantity = serializer.validated_data.get(
            'quantity_affected',
            old_quantity,
        )
        equipment_ids = sorted({old_equipment_id, new_equipment.pk})
        locked_equipment = {
            equipment.pk: equipment
            for equipment in Equipment.objects.select_for_update()
            .filter(pk__in=equipment_ids)
            .order_by('pk')
        }
        old_equipment = locked_equipment[old_equipment_id]
        target_equipment = locked_equipment[new_equipment.pk]

        if log.status != 'resolved':
            if old_equipment_id == new_equipment.pk:
                projected_maintenance = (
                    old_equipment.under_maintenance_qty
                    - old_quantity
                    + new_quantity
                )
                if (
                    projected_maintenance < 0
                    or projected_maintenance
                    + old_equipment.issued_qty
                    + old_equipment.reserved_qty
                    > old_equipment.total_qty
                ):
                    raise ValidationError({
                        'quantity_affected': 'Maintenance quantity exceeds available stock.'
                    })
                old_equipment.under_maintenance_qty = projected_maintenance
                old_equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])
            else:
                if old_equipment.under_maintenance_qty < old_quantity:
                    raise ValidationError('Maintenance stock is inconsistent; update was not applied.')
                if new_quantity > target_equipment.available_qty:
                    raise ValidationError({
                        'quantity_affected': 'Affected quantity cannot exceed currently available stock.'
                    })
                old_equipment.under_maintenance_qty -= old_quantity
                target_equipment.under_maintenance_qty += new_quantity
                old_equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])
                target_equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])

        serializer.instance = log
        updated_log = serializer.save()
        log_action(
            self.request.user,
            'maintenance_updated',
            'MaintenanceLog',
            updated_log.pk,
        )


class ResolveMaintenanceView(APIView):
    """Mark a maintenance log as resolved."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            log = MaintenanceLog.objects.select_for_update().get(pk=pk)
        except MaintenanceLog.DoesNotExist:
            return Response({'error': 'Log not found.'}, status=404)

        if log.status == 'resolved':
            return Response({'error': 'Already resolved.'}, status=400)

        equipment = Equipment.objects.select_for_update().get(
            pk=log.equipment_id
        )
        if equipment.under_maintenance_qty < log.quantity_affected:
            raise ValidationError('Maintenance stock is inconsistent; resolution was not applied.')

        log.status = 'resolved'
        log.resolved_at = timezone.now()
        log.resolved_by = request.user
        log.save()

        equipment.under_maintenance_qty -= log.quantity_affected
        equipment.save(update_fields=['under_maintenance_qty', 'updated_at'])
        log_action(
            request.user,
            'maintenance_resolved',
            'MaintenanceLog',
            log.pk,
            f'{log.quantity_affected} unit(s) of {equipment.name} returned to stock.',
        )

        return Response({'message': 'Maintenance resolved, stock released.'})

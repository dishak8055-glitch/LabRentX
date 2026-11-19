from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Category, Equipment
from .serializers import (
    CategorySerializer, EquipmentListSerializer,
    EquipmentAdminListSerializer, EquipmentDetailSerializer,
    EquipmentAdminDetailSerializer, EquipmentCreateUpdateSerializer,
)
from users.views import IsAdmin
from rentals.models import AuditLog


class CategoryListCreateView(generics.ListCreateAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class EquipmentListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_available', 'condition', 'lab_location']
    search_fields = ['name', 'brand', 'model_number', 'description', 'equipment_id']
    ordering_fields = ['name', 'created_at', 'late_fine_per_day', 'total_qty']
    ordering = ['name']

    def get_queryset(self):
        qs = Equipment.objects.select_related('category')
        if self.request.user.role != 'admin':
            qs = qs.filter(is_available=True)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EquipmentCreateUpdateSerializer
        if self.request.user.role == 'admin':
            return EquipmentAdminListSerializer
        return EquipmentListSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        equipment = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action='equipment_created',
            target_type='Equipment',
            target_id=equipment.pk,
            details=f'Equipment {equipment.equipment_id} added to inventory.',
        )


class EquipmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    def get_queryset(self):
        queryset = Equipment.objects.select_related('category')
        if self.request.user.role != 'admin':
            queryset = queryset.filter(is_available=True)
        return queryset

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return EquipmentCreateUpdateSerializer
        if self.request.user.role == 'admin':
            return EquipmentAdminDetailSerializer
        return EquipmentDetailSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAdmin()]
        return [permissions.IsAuthenticated()]

    @transaction.atomic
    def perform_update(self, serializer):
        equipment = Equipment.objects.select_for_update().get(
            pk=serializer.instance.pk
        )
        new_total = serializer.validated_data.get('total_qty', equipment.total_qty)
        allocated = (
            equipment.issued_qty
            + equipment.reserved_qty
            + equipment.under_maintenance_qty
        )
        if new_total < allocated:
            raise ValidationError({
                'total_qty': 'Total quantity cannot be lower than issued, reserved, and maintenance units.'
            })
        serializer.instance = equipment
        updated = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action='equipment_updated',
            target_type='Equipment',
            target_id=updated.pk,
            details=f'Equipment {updated.equipment_id} inventory settings updated.',
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        if instance.rental_requests.exists() or instance.maintenance_logs.exists():
            raise ValidationError(
                'Equipment with rental or maintenance history cannot be deleted. Hide it from the student catalogue instead.'
            )
        AuditLog.objects.create(
            actor=self.request.user,
            action='equipment_deleted',
            target_type='Equipment',
            target_id=instance.pk,
            details=f'Equipment {instance.equipment_id} removed from inventory.',
        )
        instance.delete()

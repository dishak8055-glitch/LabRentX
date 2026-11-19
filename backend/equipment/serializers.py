from rest_framework import serializers
from .models import Category, Equipment


class CategorySerializer(serializers.ModelSerializer):
    equipment_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'equipment_count', 'created_at']

    def get_equipment_count(self, obj):
        return obj.equipment.count()


class EquipmentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for catalog listing."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    available_qty = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Equipment
        fields = [
            'id', 'equipment_id', 'name', 'category', 'category_name',
            'brand', 'model_number', 'lab_location', 'image',
            'description', 'specifications', 'datasheet', 'total_qty', 'available_qty',
            'late_fine_per_day', 'max_rental_days', 'is_low_stock',
            'is_available', 'condition',
        ]


class EquipmentAdminListSerializer(EquipmentListSerializer):
    class Meta(EquipmentListSerializer.Meta):
        fields = EquipmentListSerializer.Meta.fields + [
            'under_maintenance_qty', 'unit_value',
        ]


class EquipmentDetailSerializer(serializers.ModelSerializer):
    """Full serializer with specs and computed fields."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    available_qty = serializers.IntegerField(read_only=True)
    issued_qty = serializers.IntegerField(read_only=True)
    reserved_qty = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Equipment
        fields = [
            'id', 'equipment_id', 'name', 'category', 'category_name',
            'brand', 'model_number', 'lab_location', 'image', 'description',
            'specifications', 'datasheet', 'total_qty', 'under_maintenance_qty',
            'issued_qty', 'reserved_qty', 'available_qty', 'condition',
            'max_rental_days', 'late_fine_per_day', 'low_stock_threshold',
            'is_available', 'is_low_stock', 'created_at', 'updated_at',
        ]


class EquipmentAdminDetailSerializer(EquipmentDetailSerializer):
    class Meta(EquipmentDetailSerializer.Meta):
        fields = EquipmentDetailSerializer.Meta.fields + ['unit_value']


class EquipmentCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = [
            'name', 'category', 'brand', 'model_number', 'lab_location',
            'image', 'description', 'specifications', 'datasheet',
            'total_qty', 'unit_value', 'condition',
            'max_rental_days', 'late_fine_per_day', 'low_stock_threshold',
            'is_available',
        ]

    def validate_total_qty(self, value):
        if value < 1:
            raise serializers.ValidationError('Total quantity must be at least 1.')
        if self.instance:
            allocated = (
                self.instance.under_maintenance_qty
                + self.instance.issued_qty
                + self.instance.reserved_qty
            )
            if value < allocated:
                raise serializers.ValidationError(
                    'Total quantity cannot be lower than issued, reserved, and maintenance units.'
                )
        return value

    def validate_max_rental_days(self, value):
        if value < 1:
            raise serializers.ValidationError('Maximum rental duration must be at least 1 day.')
        return value

    def validate_late_fine_per_day(self, value):
        if value < 0:
            raise serializers.ValidationError('Fine cannot be negative.')
        return value

    def validate_unit_value(self, value):
        if value < 0:
            raise serializers.ValidationError('Unit value cannot be negative.')
        return value

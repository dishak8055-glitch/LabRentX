from rest_framework import serializers
from .models import MaintenanceLog


class MaintenanceLogSerializer(serializers.ModelSerializer):
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_id_display = serializers.CharField(source='equipment.equipment_id', read_only=True)
    logged_by_name = serializers.CharField(source='logged_by.get_full_name', read_only=True, default=None)
    resolved_by_name = serializers.CharField(source='resolved_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = MaintenanceLog
        fields = [
            'id', 'equipment', 'equipment_name', 'equipment_id_display',
            'log_type', 'status', 'notes', 'quantity_affected',
            'logged_by', 'logged_by_name', 'related_request',
            'resolved_at', 'resolved_by', 'resolved_by_name',
            'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'logged_by', 'resolved_at', 'resolved_by', 'created_at',
        ]

    def validate_quantity_affected(self, value):
        if value < 1:
            raise serializers.ValidationError('At least one unit must be affected.')
        return value


class MaintenanceLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceLog
        fields = ['equipment', 'log_type', 'notes', 'quantity_affected', 'related_request']

    def validate_quantity_affected(self, value):
        if value < 1:
            raise serializers.ValidationError('At least one unit must be affected.')
        return value

import re
from datetime import timedelta

from rest_framework import serializers
from django.utils import timezone
from django.conf import settings
from .models import RentalRequest, AuditLog
from equipment.serializers import EquipmentListSerializer


class RentalRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for students to create rental requests."""

    class Meta:
        model = RentalRequest
        fields = [
            'equipment', 'num_days', 'start_date', 'return_date',
            'reason', 'full_name', 'enrollment_no', 'email',
            'phone', 'class_division', 'declaration_accepted',
        ]
        read_only_fields = [
            'full_name', 'enrollment_no', 'email', 'phone', 'class_division',
        ]

    def validate(self, data):
        user = self.context['request'].user

        if user.role != 'student' or user.is_blocked:
            raise serializers.ValidationError(
                'Only active students may submit equipment requests.'
            )
        if not user.enrollment_no or not user.enrollment_no.strip():
            raise serializers.ValidationError({
                'enrollment_no': 'Your account must have a registered enrollment number.'
            })

        # Check unpaid fines
        if user.has_unpaid_fines:
            raise serializers.ValidationError(
                'You have unpaid fines. Please clear them before submitting a new request.'
            )

        # Check active request limit
        max_requests = settings.LABRENTX.get('MAX_ACTIVE_REQUESTS_PER_STUDENT', 3)
        if user.active_request_count >= max_requests:
            raise serializers.ValidationError(
                f'You cannot have more than {max_requests} active requests at a time.'
            )

        # Validate dates
        if data['start_date'] < timezone.localdate():
            raise serializers.ValidationError({'start_date': 'Start date cannot be in the past.'})

        if data['num_days'] < 1:
            raise serializers.ValidationError({'num_days': 'Rental duration must be at least one day.'})

        # Validate max rental days
        equipment = data['equipment']
        if data['num_days'] > equipment.max_rental_days:
            raise serializers.ValidationError({
                'num_days': f'Cannot exceed {equipment.max_rental_days} days for this item.'
            })

        if data['return_date'] != data['start_date'] + timedelta(days=data['num_days']):
            raise serializers.ValidationError({
                'return_date': 'Return date must match the selected start date and rental duration.'
            })

        if not equipment.is_available:
            raise serializers.ValidationError('This equipment is not available for student requests.')

        # Validate availability
        if equipment.available_qty < 1:
            raise serializers.ValidationError('This equipment is currently unavailable.')

        if not data.get('reason', '').strip():
            raise serializers.ValidationError({'reason': 'Please provide an academic reason for the request.'})

        # Validate declaration
        if not data.get('declaration_accepted'):
            raise serializers.ValidationError({
                'declaration_accepted': 'You must accept the declaration.'
            })

        return data

    def create(self, validated_data):
        student = validated_data.pop(
            'student',
            self.context['request'].user,
        )
        validated_data.update({
            'student': student,
            'full_name': student.get_full_name(),
            'enrollment_no': student.enrollment_no,
            'email': student.email,
            'phone': student.phone,
            'class_division': student.class_division,
        })
        return super().create(validated_data)


class RentalRequestListSerializer(serializers.ModelSerializer):
    """Serializer for listing rental requests."""
    equipment_name = serializers.CharField(source='equipment.name', read_only=True)
    equipment_id_display = serializers.CharField(source='equipment.equipment_id', read_only=True)
    equipment_image = serializers.ImageField(source='equipment.image', read_only=True)
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_enrollment = serializers.CharField(source='student.enrollment_no', read_only=True)
    days_late = serializers.IntegerField(read_only=True)
    due_date = serializers.DateField(read_only=True)
    late_fine_per_day = serializers.DecimalField(
        source='equipment.late_fine_per_day',
        max_digits=8, decimal_places=2, read_only=True,
    )

    class Meta:
        model = RentalRequest
        fields = [
            'id', 'student', 'student_name', 'student_enrollment',
            'equipment', 'equipment_name', 'equipment_id_display', 'equipment_image',
            'num_days', 'start_date', 'return_date', 'due_date',
            'reason', 'full_name', 'enrollment_no', 'email', 'phone',
            'class_division', 'status', 'is_overdue',
            'reservation_code', 'admin_remark',
            'decided_at', 'issued_at', 'actual_return_date',
            'return_condition', 'damage_notes',
            'days_late', 'late_fine_per_day',
            'created_at', 'updated_at',
        ]


class RentalRequestDetailSerializer(RentalRequestListSerializer):
    equipment_detail = EquipmentListSerializer(source='equipment', read_only=True)

    class Meta(RentalRequestListSerializer.Meta):
        fields = RentalRequestListSerializer.Meta.fields + ['equipment_detail']


class ApproveRejectSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    remark = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['action'] == 'reject' and not data.get('remark'):
            raise serializers.ValidationError({'remark': 'Remark is required for rejection.'})
        return data


class IssueSerializer(serializers.Serializer):
    enrollment_no = serializers.CharField()
    reservation_code = serializers.CharField(max_length=20)


class ReturnSerializer(serializers.Serializer):
    CONDITION_CHOICES = ['excellent', 'good', 'fair', 'damaged']
    reservation_code = serializers.CharField(max_length=20)
    condition = serializers.ChoiceField(choices=CONDITION_CHOICES)
    damage_notes = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        if data['condition'] == 'damaged' and not data.get('damage_notes'):
            raise serializers.ValidationError({
                'damage_notes': 'Please describe the damage.'
            })
        return data


class LookupSerializer(serializers.Serializer):
    reservation_code = serializers.CharField()

    def validate_reservation_code(self, value):
        code = value.strip().upper()
        if not re.fullmatch(r'LRX-\d{5}', code):
            raise serializers.ValidationError('Reservation code must use the LRX-XXXXX format.')
        return code


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'actor', 'actor_name', 'action', 'target_type',
                  'target_id', 'details', 'timestamp']

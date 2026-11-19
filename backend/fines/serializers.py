from rest_framework import serializers
from .models import Fine


class FineSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_enrollment = serializers.CharField(source='student.enrollment_no', read_only=True)
    equipment_name = serializers.CharField(source='rental_request.equipment.name', read_only=True)
    reservation_code = serializers.CharField(source='rental_request.reservation_code', read_only=True)
    waived_by_name = serializers.CharField(source='waived_by.get_full_name', read_only=True, default=None)

    class Meta:
        model = Fine
        fields = [
            'id', 'rental_request', 'student', 'student_name', 'student_enrollment',
            'equipment_name', 'reservation_code',
            'days_late', 'amount', 'status',
            'paid_at', 'waived_by', 'waived_by_name', 'waiver_reason',
            'created_at',
        ]


class WaiveFineSerializer(serializers.Serializer):
    reason = serializers.CharField()

    def validate_reason(self, value):
        reason = value.strip()
        if len(reason) < 5:
            raise serializers.ValidationError(
                'Please provide a written justification of at least five characters.'
            )
        return reason

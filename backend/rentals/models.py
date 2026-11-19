import secrets
from datetime import timedelta

from django.db import models
from django.conf import settings
from django.utils import timezone


class RentalRequest(models.Model):
    """Equipment rental request from a student."""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('issued', 'Issued'),
        ('returned', 'Returned'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='rental_requests',
    )
    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='rental_requests',
    )
    # Request details
    num_days = models.PositiveIntegerField()
    start_date = models.DateField()
    return_date = models.DateField()
    reason = models.TextField()
    # Student details (snapshot at request time)
    full_name = models.CharField(max_length=200)
    enrollment_no = models.CharField(max_length=30)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    class_division = models.CharField(max_length=50, blank=True)
    declaration_accepted = models.BooleanField(default=False)
    # Status
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    is_overdue = models.BooleanField(default=False)
    reservation_code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    admin_remark = models.TextField(blank=True)
    # Timestamps
    decided_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='decisions',
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    actual_return_date = models.DateTimeField(null=True, blank=True)
    return_condition = models.CharField(max_length=50, blank=True)
    damage_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'rental_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reservation_code or 'REQ'}-{self.pk} ({self.student})"

    @staticmethod
    def generate_reservation_code():
        """Generate a unique code like LRX-48213."""
        prefix = settings.LABRENTX.get('RESERVATION_CODE_PREFIX', 'LRX')
        for _ in range(100):
            code = f"{prefix}-{secrets.randbelow(90000) + 10000}"
            if not RentalRequest.objects.filter(reservation_code=code).exists():
                return code
        raise RuntimeError('Could not generate an unused reservation code.')

    @property
    def due_date(self):
        """The date the equipment should be returned."""
        if self.issued_at:
            issued_date = timezone.localtime(self.issued_at).date()
            return issued_date + timedelta(days=self.num_days)
        return self.return_date

    @property
    def days_late(self):
        """Number of days late if overdue."""
        if self.status == 'returned' and self.actual_return_date:
            returned_date = timezone.localtime(self.actual_return_date).date()
            delta = returned_date - self.due_date
            return max(0, delta.days)
        elif self.status == 'issued':
            delta = timezone.localdate() - self.due_date
            return max(0, delta.days)
        return 0


class AuditLog(models.Model):
    """Tracks all significant actions."""
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
    )
    action = models.CharField(max_length=100)
    target_type = models.CharField(max_length=50)
    target_id = models.PositiveIntegerField(null=True)
    details = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.actor} - {self.action} - {self.timestamp}"

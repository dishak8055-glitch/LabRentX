from django.db import models
from django.conf import settings


class MaintenanceLog(models.Model):
    TYPE_CHOICES = (
        ('damage', 'Damage Report'),
        ('repair', 'Repair'),
        ('service', 'Scheduled Service'),
        ('calibration', 'Calibration'),
    )
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
    )

    equipment = models.ForeignKey(
        'equipment.Equipment',
        on_delete=models.CASCADE,
        related_name='maintenance_logs',
    )
    log_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    notes = models.TextField()
    quantity_affected = models.PositiveIntegerField(default=1)
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='maintenance_logged',
    )
    related_request = models.ForeignKey(
        'rentals.RentalRequest',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='maintenance_logs',
    )
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='maintenance_resolved',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'maintenance_logs'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_log_type_display()} - {self.equipment.name}"

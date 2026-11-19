from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = (
        ('request_submitted', 'Request Submitted'),
        ('request_approved', 'Request Approved'),
        ('request_rejected', 'Request Rejected'),
        ('equipment_issued', 'Equipment Issued'),
        ('equipment_returned', 'Equipment Returned'),
        ('due_reminder', 'Due Reminder'),
        ('overdue', 'Overdue'),
        ('fine_added', 'Fine Added'),
        ('low_stock', 'Low Stock'),
        ('general', 'General'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type}: {self.message[:50]}"

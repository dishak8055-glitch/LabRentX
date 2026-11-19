from django.db import models
from django.conf import settings


class Fine(models.Model):
    STATUS_CHOICES = (
        ('unpaid', 'Unpaid'),
        ('paid', 'Paid'),
        ('waived', 'Waived'),
    )

    rental_request = models.ForeignKey(
        'rentals.RentalRequest',
        on_delete=models.CASCADE,
        related_name='fines',
    )
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='fines',
    )
    days_late = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unpaid')
    paid_at = models.DateTimeField(null=True, blank=True)
    waived_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='fines_waived',
    )
    waiver_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'fines'
        ordering = ['-created_at']

    def __str__(self):
        return f"Fine ₹{self.amount} - {self.student} ({self.status})"

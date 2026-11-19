from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role-based access."""
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    enrollment_no = models.CharField(max_length=30, blank=True, unique=True, null=True)
    phone = models.CharField(max_length=15, blank=True)
    class_division = models.CharField(max_length=50, blank=True)
    is_blocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.enrollment_no or self.username})"

    @property
    def has_unpaid_fines(self):
        return self.fines.filter(status='unpaid').exists()

    @property
    def active_request_count(self):
        return self.rental_requests.filter(
            status__in=['pending', 'approved', 'issued']
        ).count()

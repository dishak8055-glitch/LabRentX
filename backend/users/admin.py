from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    fieldsets = DjangoUserAdmin.fieldsets + (
        ('LabRentX profile', {
            'fields': ('role', 'enrollment_no', 'phone', 'class_division', 'is_blocked'),
        }),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ('LabRentX profile', {
            'fields': ('role', 'enrollment_no', 'phone', 'class_division', 'is_blocked'),
        }),
    )
    list_display = [
        'username', 'first_name', 'last_name', 'role',
        'enrollment_no', 'is_active', 'is_blocked',
    ]
    list_filter = ['role', 'is_active', 'is_blocked']
    search_fields = ['username', 'first_name', 'last_name', 'enrollment_no', 'email']

    def has_delete_permission(self, request, obj=None):
        return False

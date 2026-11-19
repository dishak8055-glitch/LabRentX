from django.contrib import admin
from .models import RentalRequest, AuditLog

@admin.register(RentalRequest)
class RentalRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'reservation_code', 'student', 'equipment', 'status', 'start_date', 'return_date']
    list_filter = ['status', 'is_overdue']
    search_fields = ['reservation_code', 'enrollment_no', 'full_name']
    readonly_fields = [field.name for field in RentalRequest._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in ('GET', 'HEAD')

    def has_delete_permission(self, request, obj=None):
        return False

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['actor', 'action', 'target_type', 'target_id', 'timestamp']
    list_filter = ['action', 'target_type']
    readonly_fields = [field.name for field in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in ('GET', 'HEAD')

    def has_delete_permission(self, request, obj=None):
        return False

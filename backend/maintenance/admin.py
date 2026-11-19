from django.contrib import admin
from .models import MaintenanceLog

@admin.register(MaintenanceLog)
class MaintenanceLogAdmin(admin.ModelAdmin):
    list_display = ['equipment', 'log_type', 'status', 'quantity_affected', 'logged_by', 'created_at']
    list_filter = ['log_type', 'status']
    search_fields = ['equipment__name', 'notes']
    readonly_fields = [field.name for field in MaintenanceLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in ('GET', 'HEAD')

    def has_delete_permission(self, request, obj=None):
        return False

from django.contrib import admin
from .models import Fine

@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'amount', 'days_late', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['student__first_name', 'student__last_name', 'student__enrollment_no']
    readonly_fields = [field.name for field in Fine._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.method in ('GET', 'HEAD')

    def has_delete_permission(self, request, obj=None):
        return False

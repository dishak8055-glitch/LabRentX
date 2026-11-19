from django.contrib import admin
from .models import Category, Equipment

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = [
        'equipment_id', 'name', 'category', 'total_qty',
        'under_maintenance_qty', 'unit_value', 'condition', 'is_available',
    ]
    list_filter = ['category', 'condition', 'is_available']
    search_fields = ['name', 'equipment_id', 'brand']
    readonly_fields = ['equipment_id', 'total_qty', 'under_maintenance_qty']

    def has_delete_permission(self, request, obj=None):
        return False

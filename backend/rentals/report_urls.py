from django.urls import path
from .report_views import (
    UsageReportView,
    OverdueReportView,
    InventoryReportView,
    ExportRentalsCSVView,
    ExportAuditCSVView,
)

urlpatterns = [
    path('usage/', UsageReportView.as_view(), name='report-usage'),
    path('overdue/', OverdueReportView.as_view(), name='report-overdue'),
    path('inventory/', InventoryReportView.as_view(), name='report-inventory'),
    path('export/rentals/', ExportRentalsCSVView.as_view(), name='export-rentals'),
    path('export/audit/', ExportAuditCSVView.as_view(), name='export-audit'),
]

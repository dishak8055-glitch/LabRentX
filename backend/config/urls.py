"""
LabRentX URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/equipment/', include('equipment.urls')),
    path('api/requests/', include('rentals.urls')),
    path('api/fines/', include('fines.urls')),
    path('api/maintenance/', include('maintenance.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/dashboard/', include('rentals.dashboard_urls')),
    path('api/reports/', include('rentals.report_urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

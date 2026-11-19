from django.urls import path
from . import views

urlpatterns = [
    path('', views.MaintenanceLogListCreateView.as_view(), name='maintenance-list'),
    path('<int:pk>/', views.MaintenanceLogDetailView.as_view(), name='maintenance-detail'),
    path('<int:pk>/resolve/', views.ResolveMaintenanceView.as_view(), name='maintenance-resolve'),
]

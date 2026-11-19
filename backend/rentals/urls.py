from django.urls import path
from . import views

urlpatterns = [
    # Student endpoints
    path('', views.StudentRequestCreateView.as_view(), name='request-create'),
    path('mine/', views.StudentRequestListView.as_view(), name='my-requests'),
    path('mine/<int:pk>/', views.StudentRequestDetailView.as_view(), name='my-request-detail'),
    path('<int:pk>/cancel/', views.StudentCancelView.as_view(), name='request-cancel'),
    # Admin endpoints
    path('all/', views.AdminRequestListView.as_view(), name='admin-request-list'),
    path('all/<int:pk>/', views.AdminRequestDetailView.as_view(), name='admin-request-detail'),
    path('<int:pk>/decide/', views.ApproveRejectView.as_view(), name='request-decide'),
    path('lookup/', views.LookupView.as_view(), name='request-lookup'),
    path('<int:pk>/issue/', views.IssueView.as_view(), name='request-issue'),
    path('<int:pk>/return/', views.ReturnView.as_view(), name='request-return'),
    # Audit
    path('audit/', views.AuditLogListView.as_view(), name='audit-log'),
]

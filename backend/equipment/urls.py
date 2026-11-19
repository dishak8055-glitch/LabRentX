from django.urls import path
from . import views

urlpatterns = [
    path('', views.EquipmentListCreateView.as_view(), name='equipment-list'),
    path('<int:pk>/', views.EquipmentDetailView.as_view(), name='equipment-detail'),
    path('categories/', views.CategoryListCreateView.as_view(), name='category-list'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category-detail'),
]

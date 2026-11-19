from django.urls import path
from . import views

urlpatterns = [
    path('', views.FineListView.as_view(), name='fine-list'),
    path('<int:pk>/mark-paid/', views.MarkFinePaidView.as_view(), name='fine-mark-paid'),
    path('<int:pk>/waive/', views.WaiveFineView.as_view(), name='fine-waive'),
]

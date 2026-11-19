from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Fine
from .serializers import FineSerializer, WaiveFineSerializer
from users.views import IsAdmin
from rentals.views import log_action
from notifications.services import notify_user


class FineListView(generics.ListAPIView):
    """List fines. Admins see all, students see their own."""
    serializer_class = FineSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['student__first_name', 'student__last_name', 'student__enrollment_no']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Fine.objects.select_related(
            'rental_request__equipment', 'student', 'waived_by'
        )
        if user.role != 'admin':
            qs = qs.filter(student=user)
        return qs


class MarkFinePaidView(APIView):
    """Admin marks a fine as paid."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            fine = Fine.objects.select_for_update().select_related('student').get(pk=pk)
        except Fine.DoesNotExist:
            return Response({'error': 'Fine not found.'}, status=404)

        if fine.status != 'unpaid':
            return Response({'error': 'Fine is not unpaid.'}, status=400)

        fine.status = 'paid'
        fine.paid_at = timezone.now()
        fine.save()
        log_action(request.user, 'fine_marked_paid', 'Fine', fine.pk,
                   f'Amount: ₹{fine.amount}')
        notify_user(
            fine.student,
            'general',
            f'Your fine of ₹{fine.amount} was marked as paid.',
            '/fines',
        )
        return Response({'message': 'Fine marked as paid.'})


class WaiveFineView(APIView):
    """Admin waives a fine with a reason."""
    permission_classes = [IsAdmin]

    @transaction.atomic
    def post(self, request, pk):
        try:
            fine = Fine.objects.select_for_update().select_related('student').get(pk=pk)
        except Fine.DoesNotExist:
            return Response({'error': 'Fine not found.'}, status=404)

        if fine.status != 'unpaid':
            return Response({'error': 'Fine is not unpaid.'}, status=400)

        serializer = WaiveFineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        fine.status = 'waived'
        fine.waived_by = request.user
        fine.waiver_reason = serializer.validated_data['reason']
        fine.save()
        log_action(request.user, 'fine_waived', 'Fine', fine.pk,
                   f'Amount: ₹{fine.amount}, Reason: {fine.waiver_reason}')
        notify_user(
            fine.student,
            'general',
            f'Your fine of ₹{fine.amount} was waived: {fine.waiver_reason}',
            '/fines',
        )
        return Response({'message': 'Fine waived successfully.'})

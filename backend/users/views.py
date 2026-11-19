from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from django.db import transaction
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import User
from .serializers import (
    LoginSerializer, UserSerializer, UserCreateSerializer,
    UserUpdateSerializer, ProfileSerializer,
)
from rentals.models import AuditLog


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'admin'
            and not request.user.is_blocked
        )


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'student'
            and not request.user.is_blocked
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('refresh')
        if not isinstance(token, str) or not token.strip():
            return Response({'error': 'Refresh token required.'}, status=400)
        try:
            refresh = RefreshToken(token.strip())
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        except TokenError:
            return Response({'error': 'Invalid or expired token.'}, status=401)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer

    def get_object(self):
        return self.request.user


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdmin]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_blocked']
    search_fields = ['first_name', 'last_name', 'enrollment_no', 'email', 'username']
    ordering_fields = ['created_at', 'first_name', 'last_name']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return UserCreateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action='user_created',
            target_type='User',
            target_id=user.pk,
            details=f'Created {user.role} account {user.username}.',
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return UserUpdateSerializer
        return UserSerializer

    @transaction.atomic
    def perform_update(self, serializer):
        instance = serializer.instance
        will_disable_self = (
            instance.pk == self.request.user.pk
            and (
                serializer.validated_data.get('is_active', instance.is_active) is False
                or serializer.validated_data.get('is_blocked', instance.is_blocked) is True
            )
        )
        if will_disable_self:
            raise ValidationError('You cannot disable or block your own account.')

        updated = serializer.save()
        AuditLog.objects.create(
            actor=self.request.user,
            action='user_updated',
            target_type='User',
            target_id=updated.pk,
            details=f'Updated account status for {updated.username}.',
        )

    @transaction.atomic
    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError('You cannot deactivate your own account.')
        instance.is_active = False
        instance.is_blocked = True
        instance.save(update_fields=['is_active', 'is_blocked', 'updated_at'])
        AuditLog.objects.create(
            actor=self.request.user,
            action='user_deactivated',
            target_type='User',
            target_id=instance.pk,
            details=f'Account {instance.username} deactivated; transaction history retained.',
        )

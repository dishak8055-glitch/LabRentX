from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data['username'].strip()
        user = User.objects.filter(username__iexact=identifier).first()
        if user is None:
            user = User.objects.filter(enrollment_no__iexact=identifier).first()
        if not user or not user.check_password(data['password']):
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        if user.is_blocked:
            raise serializers.ValidationError('Account is blocked. Contact the lab administrator.')
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    has_unpaid_fines = serializers.BooleanField(read_only=True)
    active_request_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'enrollment_no', 'phone', 'class_division',
            'is_active', 'is_blocked', 'has_unpaid_fines', 'active_request_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.get_full_name()


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name',
            'role', 'enrollment_no', 'phone', 'class_division',
        ]

    def validate(self, attrs):
        candidate = User(**{
            key: value
            for key, value in attrs.items()
            if key != 'password'
        })
        validate_password(attrs['password'], user=candidate)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'email', 'first_name', 'last_name', 'phone',
            'class_division', 'is_active', 'is_blocked',
        ]


class ProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'enrollment_no', 'phone', 'class_division',
        ]
        read_only_fields = ['id', 'username', 'role', 'enrollment_no']

    def get_full_name(self, obj):
        return obj.get_full_name()

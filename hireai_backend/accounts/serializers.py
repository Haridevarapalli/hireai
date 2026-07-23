from rest_framework import serializers
from .models import User


class SignupSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default=User.ROLE_CANDIDATE)
    phone = serializers.CharField(max_length=30, required=False, default='', allow_blank=True)


class OtpVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class OtpResendSerializer(serializers.Serializer):
    email = serializers.EmailField()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class TokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class AuthUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'role']

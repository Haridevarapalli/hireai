import uuid
import logging

from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User
from .email_utils import send_otp_email
from .serializers import (
    SignupSerializer,
    OtpVerifySerializer,
    OtpResendSerializer,
    LoginSerializer,
    TokenRefreshSerializer,
    AuthUserSerializer,
)

logger = logging.getLogger(__name__)


def _issue_tokens(user):
    """Generate JWT access/refresh pair for a user."""
    refresh = RefreshToken.for_user(user)
    return {
        'user': AuthUserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """Register a new user and send OTP (printed to console)."""
    serializer = SignupSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    if User.objects.filter(email=data['email']).exists():
        return Response({'detail': 'A user with this email already exists.'},
                        status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(
        username=data['email'],
        email=data['email'],
        password=data['password'],
        full_name=data['full_name'],
        role=data['role'],
        phone=data.get('phone', ''),
        is_verified=False,
    )

    otp_code = user.generate_otp()
    try:
        send_otp_email(user.email, otp_code, full_name=user.full_name)
        logger.info(f'OTP email sent to {user.email}')
    except Exception as e:
        logger.error(f'Failed to send OTP email to {user.email}: {e}')
        # Still log to console as fallback so dev can proceed
        print(f'\n{"="*50}')
        print(f'  [FALLBACK] HireAI OTP for {user.email}: {otp_code}')
        print(f'{"="*50}\n')

    return Response({
        'user_id': str(user.id),
        'email': user.email,
        'role': user.role,
        'otp_sent': True,
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """Verify OTP and return JWT tokens."""
    serializer = OtpVerifySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(email=serializer.validated_data['email'])
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not user.verify_otp(serializer.validated_data['otp']):
        return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

    return Response(_issue_tokens(user), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp_view(request):
    """Resend OTP to user email."""
    serializer = OtpResendSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        user = User.objects.get(email=serializer.validated_data['email'])
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    otp_code = user.generate_otp()
    try:
        send_otp_email(user.email, otp_code, full_name=user.full_name)
        logger.info(f'OTP resend email sent to {user.email}')
    except Exception as e:
        logger.error(f'Failed to resend OTP email to {user.email}: {e}')
        print(f'\n{"="*50}')
        print(f'  [FALLBACK] HireAI OTP (resend) for {user.email}: {otp_code}')
        print(f'{"="*50}\n')

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate with email/password and return JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.check_password(password):
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if not user.is_verified:
        return Response({'detail': 'Email not verified. Please verify your OTP first.'},
                        status=status.HTTP_403_FORBIDDEN)

    return Response(_issue_tokens(user), status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def token_refresh_view(request):
    """Refresh JWT access token."""
    serializer = TokenRefreshSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    try:
        old_refresh = RefreshToken(serializer.validated_data['refresh'])
        new_access = str(old_refresh.access_token)
        # Rotate refresh token
        old_refresh.set_jti()
        old_refresh.set_exp()
        return Response({
            'access': new_access,
            'refresh': str(old_refresh),
        })
    except Exception:
        return Response({'detail': 'Invalid or expired refresh token.'},
                        status=status.HTTP_401_UNAUTHORIZED)

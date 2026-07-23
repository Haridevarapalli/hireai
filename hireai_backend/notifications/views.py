from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Notification, DeviceToken


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_notifications_view(request):
    """List current user's notifications."""
    notifications = Notification.objects.filter(user=request.user)[:50]
    data = [
        {
            'id': n.id,
            'type': n.type,
            'title': n.title,
            'body': n.body,
            'created_at': n.created_at.isoformat(),
            'read': n.read,
            'payload': n.payload or {},
        }
        for n in notifications
    ]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_device_view(request):
    """Register a device push token."""
    token = request.data.get('token', '')
    platform = request.data.get('platform', 'android')

    if not token:
        return Response({'detail': 'Token required.'}, status=status.HTTP_400_BAD_REQUEST)

    device, created = DeviceToken.objects.update_or_create(
        user=request.user,
        token=token,
        defaults={'platform': platform},
    )

    return Response({
        'registered': True,
        'id': device.id,
    })

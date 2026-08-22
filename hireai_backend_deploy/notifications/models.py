from django.conf import settings
from django.db import models


class Notification(models.Model):
    """In-app notification for a user."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=50, default='info')
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'notifications_notification'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} -> {self.user.email}'


class DeviceToken(models.Model):
    """Push notification device token."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='device_tokens',
    )
    token = models.CharField(max_length=500)
    platform = models.CharField(max_length=20, default='android')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications_device_token'
        unique_together = [('user', 'token')]

    def __str__(self):
        return f'{self.platform} token for {self.user.email}'

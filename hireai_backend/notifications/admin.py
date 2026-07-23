from django.contrib import admin
from .models import Notification, DeviceToken

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'type', 'title', 'read', 'created_at']
    list_filter = ['type', 'read']

@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'platform', 'created_at']

from django.contrib import admin
from .models import Job

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'role_type', 'status', 'created_by', 'created_at']
    list_filter = ['status', 'role_type', 'is_remote']
    search_fields = ['title', 'company']

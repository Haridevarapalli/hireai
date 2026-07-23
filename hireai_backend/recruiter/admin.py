from django.contrib import admin
from .models import RecruiterProfile

@admin.register(RecruiterProfile)
class RecruiterProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'title']
    search_fields = ['user__email', 'company_name']

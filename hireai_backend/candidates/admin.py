from django.contrib import admin
from .models import CandidateProfile

@admin.register(CandidateProfile)
class CandidateProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'parse_status', 'updated_at']
    search_fields = ['user__email', 'user__full_name']

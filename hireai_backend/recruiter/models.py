from django.conf import settings
from django.db import models


class RecruiterProfile(models.Model):
    """Extended profile for recruiters."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='recruiter_profile',
    )
    company_name = models.CharField(max_length=255, blank=True, default='')
    title = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=30, blank=True, default='')
    linkedin_url = models.CharField(max_length=500, blank=True, default='')
    bio = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'recruiter_profile'

    def __str__(self):
        return f'RecruiterProfile({self.user.email})'

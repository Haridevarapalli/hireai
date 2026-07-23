import uuid
from django.conf import settings
from django.db import models


class CandidateProfile(models.Model):
    """Extended profile for candidates — linked 1:1 to User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_profile',
    )
    phone = models.CharField(max_length=30, blank=True, default='')
    tech_stacks = models.JSONField(default=list, blank=True)
    resume_file = models.FileField(upload_to='resumes/', blank=True, null=True)
    resume_id = models.CharField(max_length=100, blank=True, default='')
    resume_hash = models.CharField(max_length=128, blank=True, default='')
    parse_status = models.CharField(max_length=30, blank=True, default='')
    parsed_resume_json = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'candidates_profile'

    def __str__(self):
        return f'CandidateProfile({self.user.email})'

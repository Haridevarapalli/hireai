from django.conf import settings
from django.db import models


class Job(models.Model):
    """Job listing posted by a recruiter."""

    STATUS_OPEN = 'open'
    STATUS_CLOSED = 'closed'
    STATUS_DRAFT = 'draft'
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Open'),
        (STATUS_CLOSED, 'Closed'),
        (STATUS_DRAFT, 'Draft'),
    ]

    ROLE_FULL_TIME = 'FULL_TIME'
    ROLE_CONTRACT = 'CONTRACT'
    ROLE_PART_TIME = 'PART_TIME'
    ROLE_CHOICES = [
        (ROLE_FULL_TIME, 'Full Time'),
        (ROLE_CONTRACT, 'Contract'),
        (ROLE_PART_TIME, 'Part Time'),
    ]

    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, default='')
    is_remote = models.BooleanField(default=False)
    role_type = models.CharField(max_length=30, choices=ROLE_CHOICES, default=ROLE_FULL_TIME)
    salary_min = models.IntegerField(null=True, blank=True)
    salary_max = models.IntegerField(null=True, blank=True)
    currency = models.CharField(max_length=10, default='INR')
    required_skills = models.JSONField(default=list, blank=True)
    min_match_score = models.IntegerField(default=70)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posted_jobs',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'jobs_job'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} @ {self.company}'


class SavedJob(models.Model):
    """A candidate's saved / bookmarked job listing."""

    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='saved_jobs',
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='saved_by_candidates',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'jobs_saved_job'
        unique_together = [('candidate', 'job')]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.candidate.email} saved {self.job.title}'


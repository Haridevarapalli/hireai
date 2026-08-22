from django.conf import settings
from django.db import models
from jobs.models import Job


class Application(models.Model):
    """A candidate's application to a job."""

    STATUS_APPLIED = 'applied'
    STATUS_AI_SCREENING = 'ai_screening'
    STATUS_SHORTLISTED = 'shortlisted'
    STATUS_INTERVIEW = 'interview'
    STATUS_OFFER_SENT = 'offer_sent'
    STATUS_OFFER_SIGNED = 'offer_signed'
    STATUS_OFFER_ACCEPTED = 'offer_accepted'
    STATUS_REJECTED = 'rejected'
    STATUS_HR_PENDING = 'hr_pending'
    STATUS_HR_PASSED = 'hr_passed'
    STATUS_HR_FAILED = 'hr_failed'
    STATUS_TECH_PENDING = 'tech_pending'
    STATUS_TECH_PASSED = 'tech_passed'
    STATUS_TECH_FAILED = 'tech_failed'

    STATUS_CHOICES = [
        (STATUS_APPLIED, 'Applied'),
        (STATUS_AI_SCREENING, 'AI Screening'),
        (STATUS_SHORTLISTED, 'Shortlisted'),
        (STATUS_INTERVIEW, 'Interview'),
        (STATUS_OFFER_SENT, 'Offer Sent'),
        (STATUS_OFFER_SIGNED, 'Offer Signed'),
        (STATUS_OFFER_ACCEPTED, 'Offer Accepted'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_HR_PENDING, 'HR Pending'),
        (STATUS_HR_PASSED, 'HR Passed'),
        (STATUS_HR_FAILED, 'HR Failed'),
        (STATUS_TECH_PENDING, 'Tech Pending'),
        (STATUS_TECH_PASSED, 'Tech Passed'),
        (STATUS_TECH_FAILED, 'Tech Failed'),
    ]

    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='applications')
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='applications'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default=STATUS_APPLIED)
    match_score = models.IntegerField(null=True, blank=True)
    hr_score = models.FloatField(null=True, blank=True)
    tech_score = models.FloatField(null=True, blank=True)
    tech_language = models.CharField(max_length=50, blank=True, default='')
    next_action = models.CharField(max_length=50, blank=True, default='')
    last_failure_reason = models.CharField(max_length=255, blank=True, default='')
    retry_eligible_at = models.DateTimeField(null=True, blank=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'applications_application'
        ordering = ['-applied_at']

    def __str__(self):
        return f'{self.candidate.email} -> {self.job.title}'

    def compute_next_action(self):
        """Determine next action based on current status."""
        mapping = {
            self.STATUS_APPLIED: 'START_HR',
            self.STATUS_HR_PENDING: 'CONTINUE_HR',
            self.STATUS_HR_PASSED: 'START_TECH',
            self.STATUS_TECH_PENDING: 'CONTINUE_TECH',
            self.STATUS_TECH_PASSED: 'VIEW_OFFER',
            self.STATUS_OFFER_SENT: 'VIEW_OFFER',
            self.STATUS_OFFER_SIGNED: 'VIEW_OFFER',
            self.STATUS_OFFER_ACCEPTED: 'DONE',
            self.STATUS_HR_FAILED: 'RETRY_HR',
            self.STATUS_TECH_FAILED: 'RETRY_TECH',
            self.STATUS_SHORTLISTED: 'START_HR',
            self.STATUS_REJECTED: '',
        }
        self.next_action = mapping.get(self.status, '')
        self.save(update_fields=['next_action'])


class AssessmentSession(models.Model):
    """A timed assessment session (HR or Tech)."""

    STAGE_HR = 'HR'
    STAGE_TECH = 'TECH'
    STAGE_CHOICES = [(STAGE_HR, 'HR'), (STAGE_TECH, 'Tech')]

    STATUS_PENDING = 'pending'
    STATUS_ACTIVE = 'active'
    STATUS_COMPLETED = 'completed'
    STATUS_SUBMITTED = 'submitted'
    STATUS_CHOICES_SESSION = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACTIVE, 'Active'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_SUBMITTED, 'Submitted'),
    ]

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='sessions')
    stage = models.CharField(max_length=10, choices=STAGE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES_SESSION, default=STATUS_ACTIVE)
    language = models.CharField(max_length=50, blank=True, default='')
    ends_at = models.DateTimeField(null=True, blank=True)
    duration_secs = models.IntegerField(default=1800)  # 30 minutes
    total_questions = models.IntegerField(default=10)
    answered_questions = models.IntegerField(default=0)
    exam_mode = models.CharField(max_length=20, default='mcq')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'applications_session'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.stage} session for {self.application}'


class AssessmentQuestion(models.Model):
    """An MCQ question in an assessment session."""

    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='questions')
    prompt = models.TextField()
    options = models.JSONField(default=list)
    tags = models.JSONField(default=list, blank=True)
    correct_option = models.IntegerField(default=0)
    explanation = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'applications_question'

    def __str__(self):
        return f'Q: {self.prompt[:60]}'


class AssessmentAnswer(models.Model):
    """A candidate's answer to an assessment question."""

    session = models.ForeignKey(AssessmentSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(AssessmentQuestion, on_delete=models.CASCADE, related_name='answers')
    selected_option_index = models.IntegerField()
    is_correct = models.BooleanField(default=False)
    time_spent_ms = models.BigIntegerField(default=0)

    class Meta:
        db_table = 'applications_answer'
        unique_together = [('session', 'question')]

    def __str__(self):
        return f'Answer to {self.question.id} -> {self.selected_option_index}'


class Offer(models.Model):
    """Offer letter for an application."""

    STATUS_PENDING = 'pending'
    STATUS_SIGNED = 'signed'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SIGNED, 'Signed'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]

    application = models.OneToOneField(Application, on_delete=models.CASCADE, related_name='offer')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    offer_pdf_url = models.CharField(max_length=500, blank=True, default='')
    signed_pdf_url = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'applications_offer'

    def __str__(self):
        return f'Offer for {self.application} ({self.status})'


class ApplicationStatusHistory(models.Model):
    """Tracks chronological status transitions for each application."""

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='status_history',
    )
    from_status = models.CharField(max_length=30, blank=True, default='')
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='status_changes_made',
    )
    note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'applications_status_history'
        ordering = ['created_at']

    def __str__(self):
        return f'App #{self.application.id}: {self.from_status} -> {self.to_status}'


class Interview(models.Model):
    """A scheduled interview between recruiter and candidate."""

    STATUS_SCHEDULED = 'scheduled'
    STATUS_COMPLETED = 'completed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_SCHEDULED, 'Scheduled'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    ]

    application = models.ForeignKey(
        Application,
        on_delete=models.CASCADE,
        related_name='interviews',
    )
    candidate = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='candidate_interviews',
    )
    recruiter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='scheduled_interviews',
    )
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name='interviews',
    )
    title = models.CharField(max_length=255, default='Technical & HR Interview')
    scheduled_at = models.DateTimeField()
    duration_minutes = models.IntegerField(default=45)
    meeting_link = models.CharField(max_length=500, default='https://meet.google.com/smarthire-ai-interview')
    interview_type = models.CharField(max_length=50, default='HR & Technical')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_SCHEDULED)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'applications_interview'
        ordering = ['scheduled_at']

    def __str__(self):
        return f'Interview with {self.candidate.email} for {self.job.title}'


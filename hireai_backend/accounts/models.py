import random
import string
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Custom user with role, phone, and OTP fields."""

    ROLE_CANDIDATE = 'CANDIDATE'
    ROLE_RECRUITER = 'RECRUITER'
    ROLE_CHOICES = [
        (ROLE_CANDIDATE, 'Candidate'),
        (ROLE_RECRUITER, 'Recruiter'),
    ]

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True, default='')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CANDIDATE)
    phone = models.CharField(max_length=30, blank=True, default='')
    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, default='')
    otp_expires_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'accounts_user'

    def __str__(self):
        return f'{self.full_name} ({self.email})'

    def generate_otp(self):
        """Generate a 6-digit OTP and set expiry."""
        self.otp = ''.join(random.choices(string.digits, k=6))
        validity = getattr(settings, 'OTP_VALIDITY_MINUTES', 10)
        self.otp_expires_at = timezone.now() + timedelta(minutes=validity)
        self.save(update_fields=['otp', 'otp_expires_at'])
        return self.otp

    def verify_otp(self, otp_value):
        """Verify OTP and mark user as verified."""
        if not self.otp or not self.otp_expires_at:
            return False
        if timezone.now() > self.otp_expires_at:
            return False
        if self.otp != otp_value:
            return False
        self.is_verified = True
        self.otp = ''
        self.otp_expires_at = None
        self.save(update_fields=['is_verified', 'otp', 'otp_expires_at'])
        return True

"""
Email utility for sending OTP codes via Gmail SMTP.
"""

from django.core.mail import send_mail
from django.conf import settings


def send_otp_email(user_email, otp_code, full_name=''):
    """Send OTP verification email to the user."""
    subject = f'HireAI - Your Verification Code: {otp_code}'

    name = full_name or user_email.split('@')[0]

    plain_message = (
        f'Hi {name},\n\n'
        f'Your HireAI verification code is: {otp_code}\n\n'
        f'This code will expire in {settings.OTP_VALIDITY_MINUTES} minutes.\n\n'
        f'If you did not request this code, please ignore this email.\n\n'
        f'— HireAI Team'
    )

    html_message = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f1117; border-radius: 16px;">
        <h2 style="color: #f5f7fa; margin: 0 0 8px;">HireAI</h2>
        <p style="color: #b6bdc9; margin: 0 0 24px; font-size: 14px;">Email Verification</p>
        <hr style="border: none; border-top: 1px solid #2c303b; margin: 0 0 24px;">
        <p style="color: #f5f7fa; font-size: 16px; margin: 0 0 16px;">Hi {name},</p>
        <p style="color: #b6bdc9; font-size: 14px; margin: 0 0 24px;">Use the code below to verify your email address:</p>
        <div style="background: #1a1d25; border: 1px solid #2c303b; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #2f67f6;">{otp_code}</span>
        </div>
        <p style="color: #7b8497; font-size: 13px; margin: 0 0 8px;">⏱ This code expires in {settings.OTP_VALIDITY_MINUTES} minutes.</p>
        <p style="color: #7b8497; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #2c303b; margin: 24px 0;">
        <p style="color: #4a5060; font-size: 12px; text-align: center; margin: 0;">© HireAI — Powered by AI Recruitment</p>
    </div>
    """

    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user_email],
        html_message=html_message,
        fail_silently=False,
    )

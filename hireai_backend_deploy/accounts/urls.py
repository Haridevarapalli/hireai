from django.urls import path
from . import views

urlpatterns = [
    path('signup', views.signup_view),
    path('verify-otp', views.verify_otp_view),
    path('resend-otp', views.resend_otp_view),
    path('login', views.login_view),
    path('token/refresh', views.token_refresh_view),
    path('change-password', views.change_password_view),
]


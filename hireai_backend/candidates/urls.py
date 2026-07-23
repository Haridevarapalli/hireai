from django.urls import path
from . import views

urlpatterns = [
    path('profile', views.candidate_profile_view),
    path('resume/upload', views.resume_upload_view),
    path('resume/parse', views.resume_parse_view),
    path('resume/parse-start', views.resume_parse_start_view),
    path('resume/parse-status', views.resume_parse_status_view),
    path('resume/parse-cancel', views.resume_parse_cancel_view),
    path('resume/parse-retry', views.resume_parse_retry_view),
    path('resume/remove', views.resume_remove_view),
]

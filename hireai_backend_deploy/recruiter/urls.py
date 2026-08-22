from django.urls import path
from . import views

# Recruiter endpoints under api/recruiter/
urlpatterns = [
    path('dashboard', views.dashboard_view),
    path('jobs', views.recruiter_jobs_view),
    path('jobs/<int:job_id>', views.recruiter_job_detail_view),
    path('jobs/<int:job_id>/close', views.recruiter_job_close_view),
    path('jobs/<int:job_id>/applicants', views.recruiter_job_applicants_view),
    path('applicants', views.recruiter_all_applicants_view),
    path('ai-screening', views.recruiter_ai_screening_view),
    path('offers', views.recruiter_offers_view),
    path('offers/<int:offer_id>', views.recruiter_offer_detail_view),
    path('applications/<int:application_id>/action', views.recruiter_application_action_view),
    path('applications/<int:application_id>/candidate-profile', views.recruiter_candidate_profile_view),
    path('interviews', views.recruiter_interviews_view),
    path('profile', views.recruiter_profile_view),
]

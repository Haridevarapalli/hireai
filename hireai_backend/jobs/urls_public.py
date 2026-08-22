from django.urls import path
from . import views

# Public job endpoints under api/jobs/
urlpatterns = [
    path('', views.list_jobs_view),
    path('saved', views.list_saved_jobs_view),
    path('saved/', views.list_saved_jobs_view),
    path('recommended', views.list_recommended_jobs_view),
    path('recommended/', views.list_recommended_jobs_view),
    path('<int:job_id>', views.get_job_detail_view),
    path('<int:job_id>/', views.get_job_detail_view),
    path('<int:job_id>/save', views.save_job_view),
    path('<int:job_id>/save/', views.save_job_view),
    path('<int:job_id>/match-score', views.match_score_view),
    path('<int:job_id>/match-score/', views.match_score_view),
]

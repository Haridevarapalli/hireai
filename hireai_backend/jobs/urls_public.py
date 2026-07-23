from django.urls import path
from . import views

# Public job endpoints under api/jobs/
urlpatterns = [
    path('', views.list_jobs_view),
    path('<int:job_id>/match-score', views.match_score_view),
]

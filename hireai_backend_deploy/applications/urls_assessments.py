from django.urls import path
from . import views

# Assessment session endpoints under api/assessments/
urlpatterns = [
    path('sessions/<int:session_id>/questions', views.assessment_questions_view),
    path('sessions/<int:session_id>/answer', views.assessment_answer_view),
    path('sessions/<int:session_id>/submit', views.assessment_submit_view),
    path('sessions/<int:session_id>/status', views.assessment_status_view),
]

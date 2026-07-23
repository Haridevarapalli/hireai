from django.urls import path
from . import views

# Candidate application endpoints under api/applications/
urlpatterns = [
    path('', views.apply_view),
    path('mine', views.my_applications_view),
    path('mine/<int:application_id>', views.my_application_detail_view),
    path('<int:application_id>/hr/prep', views.hr_prep_view),
    path('<int:application_id>/hr/start', views.hr_start_view),
    path('<int:application_id>/hr/submit', views.hr_submit_view),
    path('<int:application_id>/tech/select-language', views.tech_select_language_view),
    path('<int:application_id>/tech/prep', views.tech_prep_view),
    path('<int:application_id>/tech/start', views.tech_start_view),
    path('<int:application_id>/tech/submit', views.tech_submit_view),
    path('<int:application_id>/offer', views.get_offer_view),
    path('<int:application_id>/offer/sign', views.sign_offer_view),
    path('<int:application_id>/offer/accept', views.accept_offer_view),
]

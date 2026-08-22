from django.urls import path
from . import views

urlpatterns = [
    path('', views.my_notifications_view),
    path('mine', views.my_notifications_view),
    path('mark-all-read', views.mark_all_read_view),
    path('<int:notification_id>/read', views.mark_notification_read_view),
    path('<int:notification_id>', views.delete_notification_view),
]


"""
URL configuration for HireAI backend.
All API endpoints are prefixed with api/.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({
        "status": "ok", 
        "message": "HireAI API is running. Access endpoints via /api/"
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/candidate/', include('candidates.urls')),
    path('api/jobs/', include('jobs.urls_public')),
    path('api/applications/', include('applications.urls_candidate')),
    path('api/assessments/', include('applications.urls_assessments')),
    path('api/recruiter/', include('recruiter.urls')),
    path('api/notifications/', include('notifications.urls_notifications')),
    path('api/devices/', include('notifications.urls_devices')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

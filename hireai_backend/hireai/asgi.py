"""ASGI config for HireAI project."""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hireai.settings')
application = get_asgi_application()

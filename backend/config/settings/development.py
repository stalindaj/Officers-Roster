"""
Development settings for officer tracking system
"""

import os
from .base import *

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Database for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'officer_tracking'),
        'USER': os.getenv('DB_USER', 'officer_admin'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'secure_password_change_me'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}

# Enable debug toolbar (safe version)
if DEBUG:
    try:
        import debug_toolbar

        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
        INTERNAL_IPS = ['127.0.0.1']
    except ImportError:
        pass
"""
URL configuration for officer tracking system
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/users/', include('apps.users.urls')),
    path('api/officers/', include('apps.officers.urls')),
    path('api/units/', include('apps.units.urls')),
    path('api/assignments/', include('apps.assignments.urls')),
    path('api/flight-logs/', include('apps.flight_logs.urls')),
    path('api/qualifications/', include('apps.qualifications.urls')),
    path('api/promotion-points/', include('apps.promotion_points.urls')),
    path('api/', include('apps.flight_logs.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [path('__debug__/', include('debug_toolbar.urls'))]
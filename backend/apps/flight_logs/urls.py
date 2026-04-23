from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'aircraft', views.AircraftTypeViewSet)
router.register(r'flight-types', views.FlightTypeViewSet)
router.register(r'mission-types', views.MissionTypeViewSet)
router.register(r'flight-logs', views.FlightLogViewSet)
router.register(r'flight-summaries', views.FlightSummaryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
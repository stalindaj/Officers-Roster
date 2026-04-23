from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'succession-plans', views.SuccessionPlanViewSet)
router.register(r'transition-logs', views.TransitionLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
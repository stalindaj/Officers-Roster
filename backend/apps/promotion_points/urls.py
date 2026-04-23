from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'periods', views.PromotionPeriodViewSet)
router.register(r'points', views.PromotionPointsViewSet)
router.register(r'recommendations', views.PromotionRecommendationViewSet)
router.register(r'history', views.PromotionHistoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
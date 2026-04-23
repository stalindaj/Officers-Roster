from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'qualification-types', views.QualificationTypeViewSet)
router.register(r'qualifications', views.QualificationViewSet)
router.register(r'ratings', views.RatingViewSet)
router.register(r'instructor-specialties', views.InstructorSpecialtyViewSet)
router.register(r'special-duties', views.SpecialDutyViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
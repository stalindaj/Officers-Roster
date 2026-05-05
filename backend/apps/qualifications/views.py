from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Qualification
from .serializers import QualificationSerializer


class QualificationViewSet(viewsets.ModelViewSet):
    queryset = Qualification.objects.all()
    serializer_class = QualificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['officer', 'qualification_type', 'status']
    search_fields = ['name', 'certificate_number', 'issuing_authority']
    ordering_fields = ['date_earned', 'expiration_date', 'name']
    ordering = ['-date_earned']
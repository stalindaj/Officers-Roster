from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Officer
from .serializers import OfficerSerializer, OfficerDetailSerializer

class OfficerViewSet(viewsets.ModelViewSet):
    queryset = Officer.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['rank', 'status']
    search_fields = ['first_name', 'last_name', 'paf_number']
    ordering_fields = ['rank', 'last_name', 'date_commissioned']
    ordering = ['rank', 'last_name']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return OfficerDetailSerializer
        return OfficerSerializer
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import FlightLog
from .serializers import FlightLogSerializer


class FlightLogViewSet(viewsets.ModelViewSet):
    queryset = FlightLog.objects.all()
    serializer_class = FlightLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['officer', 'aircraft_type', 'mission_type']
    ordering_fields = ['flight_date', 'flight_hours']
    ordering = ['-flight_date']
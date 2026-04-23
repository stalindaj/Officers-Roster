from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Q
from .models import AircraftType, FlightType, MissionType, FlightLog, FlightSummary
from .serializers import (
    AircraftTypeSerializer, FlightTypeSerializer, MissionTypeSerializer,
    FlightLogSerializer, FlightLogCreateSerializer, FlightSummarySerializer
)
from apps.officers.models import Officer

class AircraftTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AircraftType.objects.filter(is_active=True)
    serializer_class = AircraftTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['aircraft_code', 'aircraft_name']

class FlightTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FlightType.objects.all()
    serializer_class = FlightTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class MissionTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MissionType.objects.all()
    serializer_class = MissionTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class FlightLogViewSet(viewsets.ModelViewSet):
    queryset = FlightLog.objects.select_related('officer', 'aircraft', 'flight_type', 'mission_type')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer', 'aircraft', 'flight_type', 'mission_type', 'is_night_flight', 'is_simulator']
    search_fields = ['officer__first_name', 'officer__last_name', 'sortie_number', 'remarks']
    ordering_fields = ['flight_date', 'flight_hours', 'created_at']
    ordering = ['-flight_date']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FlightLogCreateSerializer
        return FlightLogSerializer
    
    @action(detail=False, methods=['get'])
    def officer_summary(self, request):
        """Get flight summary for a specific officer"""
        officer_id = request.query_params.get('officer_id')
        if not officer_id:
            return Response({'error': 'officer_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            summary = FlightSummary.objects.get(officer_id=officer_id)
            serializer = FlightSummarySerializer(summary)
            return Response(serializer.data)
        except FlightSummary.DoesNotExist:
            return Response({'error': 'No flight data found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def totals_by_officer(self, request):
        """Get aggregated totals for all officers or filtered"""
        queryset = FlightLog.objects.select_related('officer')
        
        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(flight_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(flight_date__lte=end_date)
        
        totals = queryset.values('officer__id', 'officer__first_name', 'officer__last_name', 'officer__rank').annotate(
            total_hours=Sum('flight_hours'),
            total_flights=Count('id'),
            night_hours=Sum('flight_hours', filter=Q(is_night_flight=True)),
            instrument_hours=Sum('flight_hours', filter=Q(is_instrument_flight=True))
        ).order_by('-total_hours')
        
        return Response(totals)
    
    @action(detail=True, methods=['post'])
    def refresh_summary(self, request, pk=None):
        """Refresh the flight summary for a specific officer"""
        flight_log = self.get_object()
        officer = flight_log.officer
        summary, created = FlightSummary.objects.get_or_create(officer=officer)
        summary.refresh()
        return Response({'status': 'summary refreshed'})

class FlightSummaryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FlightSummary.objects.select_related('officer')
    serializer_class = FlightSummarySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer']
    search_fields = ['officer__first_name', 'officer__last_name']
    ordering_fields = ['total_flight_hours', 'total_flights', 'last_flight_date']
    ordering = ['-total_flight_hours']
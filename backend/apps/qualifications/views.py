from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Q
from .models import QualificationType, Qualification, Rating, InstructorSpecialty, SpecialDuty
from .serializers import (
    QualificationTypeSerializer, QualificationSerializer, QualificationCreateSerializer,
    RatingSerializer, InstructorSpecialtySerializer, SpecialDutySerializer
)

class QualificationTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = QualificationType.objects.filter(is_active=True)
    serializer_class = QualificationTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['category']
    search_fields = ['qualification_code', 'qualification_name']

class QualificationViewSet(viewsets.ModelViewSet):
    queryset = Qualification.objects.select_related('officer', 'qualification_type')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer', 'qualification_type', 'status']
    search_fields = ['officer__first_name', 'officer__last_name', 'certificate_number']
    ordering_fields = ['date_earned', 'expiry_date', 'score']
    ordering = ['-date_earned']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return QualificationCreateSerializer
        return QualificationSerializer
    
    @action(detail=False, methods=['get'])
    def active_for_officer(self, request):
        """Get all active qualifications for a specific officer"""
        officer_id = request.query_params.get('officer_id')
        if not officer_id:
            return Response({'error': 'officer_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        qualifications = self.queryset.filter(
            officer_id=officer_id,
            status='ACTIVE'
        ).filter(
            Q(expiry_date__isnull=True) | Q(expiry_date__gte=models.functions.Now())
        )
        serializer = self.get_serializer(qualifications, many=True)
        return Response(serializer.data)

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.select_related('officer', 'certified_by')
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['rating_level', 'officer']
    search_fields = ['officer__first_name', 'officer__last_name']

class InstructorSpecialtyViewSet(viewsets.ModelViewSet):
    queryset = InstructorSpecialty.objects.select_related('officer', 'aircraft_type')
    serializer_class = InstructorSpecialtySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['officer', 'aircraft_type', 'is_current']
    search_fields = ['officer__first_name', 'officer__last_name', 'specialty_name']

class SpecialDutyViewSet(viewsets.ModelViewSet):
    queryset = SpecialDuty.objects.select_related('officer')
    serializer_class = SpecialDutySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['officer', 'is_current']
    search_fields = ['officer__first_name', 'officer__last_name', 'duty_name']
    
    @action(detail=False, methods=['get'])
    def total_points_by_officer(self, request):
        """Get total special duty points for each officer"""
        officer_id = request.query_params.get('officer_id')
        queryset = SpecialDuty.objects.filter(is_current=True)
        
        if officer_id:
            queryset = queryset.filter(officer_id=officer_id)
        
        totals = queryset.values('officer__id', 'officer__first_name', 'officer__last_name').annotate(
            total_points=Sum('points_value')
        ).order_by('-total_points')
        
        return Response(totals)
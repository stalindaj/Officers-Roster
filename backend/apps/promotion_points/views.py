from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Sum, Avg
from .models import PromotionPeriod, PromotionPoints, PromotionRecommendation, PromotionHistory
from .serializers import (
    PromotionPeriodSerializer, PromotionPointsSerializer, PromotionPointsCreateSerializer,
    PromotionRecommendationSerializer, PromotionHistorySerializer, PromotionBoardReportSerializer
)
from apps.officers.models import Officer

class PromotionPeriodViewSet(viewsets.ModelViewSet):
    queryset = PromotionPeriod.objects.all()
    serializer_class = PromotionPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['period_name', 'period_code']
    ordering_fields = ['evaluation_date', 'start_date']
    ordering = ['-evaluation_date']
    
    @action(detail=True, methods=['post'])
    def close_period(self, request, pk=None):
        """Close a promotion period (no more edits)"""
        period = self.get_object()
        period.status = 'CLOSED'
        period.save()
        return Response({'status': 'period closed'})
    
    @action(detail=True, methods=['post'])
    def generate_recommendations(self, request, pk=None):
        """Generate promotion recommendations for all officers in this period"""
        period = self.get_object()
        
        points_records = PromotionPoints.objects.filter(period=period).select_related('officer')
        
        recommendations_created = 0
        for points in points_records:
            recommendation, created = PromotionRecommendation.objects.update_or_create(
                officer=points.officer,
                period=period,
                defaults={
                    'points_record': points,
                    'recommendation': points.recommended_promotion,
                    'score': points.total_points,
                    'rank_eligible_for': self._get_eligible_rank(points.officer, points.recommended_promotion)
                }
            )
            if created:
                recommendations_created += 1
        
        return Response({
            'status': 'recommendations generated',
            'created': recommendations_created,
            'total': points_records.count()
        })
    
    def _get_eligible_rank(self, officer, recommendation):
        """Determine what rank officer is eligible for"""
        if recommendation == 'COMMAND':
            if officer.rank in ['MAJ', 'CPT']:
                return 'LTC'
        elif recommendation == 'SENIOR':
            if officer.rank == 'CPT':
                return 'MAJ'
        return ''

class PromotionPointsViewSet(viewsets.ModelViewSet):
    queryset = PromotionPoints.objects.select_related('officer', 'period', 'evaluated_by')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer', 'period']
    search_fields = ['officer__first_name', 'officer__last_name', 'remarks']
    ordering_fields = ['total_points', 'period__evaluation_date']
    ordering = ['-period__evaluation_date', '-total_points']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PromotionPointsCreateSerializer
        return PromotionPointsSerializer
    
    @action(detail=False, methods=['get'])
    def promotion_board(self, request):
        """Get data for promotion board - ranking of eligible officers"""
        period_id = request.query_params.get('period_id')
        if not period_id:
            return Response({'error': 'period_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        points_records = self.queryset.filter(period_id=period_id).order_by('-total_points')
        
        # Build promotion board report
        report_data = []
        for points in points_records:
            report_data.append({
                'officer_id': points.officer.id,
                'officer_name': points.officer.full_name,
                'rank': points.officer.rank,
                'period': points.period.period_name,
                'total_points': points.total_points,
                'qualification': points.qualification_points,
                'instructor': points.instructor_points,
                'special_duties': points.special_duties_points,
                'command': points.command_o4_points + points.command_o5_points,
                'flying_hours': points.flying_hours,
                'rating': points.flying_rating,
                'recommendation': points.recommended_promotion,
                'status': 'ELIGIBLE' if points.is_promotable_to_command else 'UNDER_REVIEW'
            })
        
        serializer = PromotionBoardReportSerializer(report_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_performers(self, request):
        """Get top performers by points"""
        period_id = request.query_params.get('period_id')
        limit = int(request.query_params.get('limit', 10))
        
        queryset = self.queryset
        if period_id:
            queryset = queryset.filter(period_id=period_id)
        
        top = queryset.order_by('-total_points')[:limit]
        serializer = self.get_serializer(top, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get promotion points statistics"""
        period_id = request.query_params.get('period_id')
        
        queryset = self.queryset
        if period_id:
            queryset = queryset.filter(period_id=period_id)
        
        stats = queryset.aggregate(
            average_points=Avg('total_points'),
            max_points=Max('total_points'),
            min_points=Min('total_points'),
            total_officers=Count('id'),
            above_command_threshold=Count('id', filter=Q(total_points__gte=F('period__command_threshold'))),
            above_senior_threshold=Count('id', filter=Q(total_points__gte=F('period__senior_threshold'))),
        )
        
        return Response(stats)


class PromotionRecommendationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromotionRecommendation.objects.select_related('officer', 'period', 'points_record')
    serializer_class = PromotionRecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer', 'period', 'recommendation', 'is_approved']
    search_fields = ['officer__first_name', 'officer__last_name']
    ordering_fields = ['score', 'period__evaluation_date']
    ordering = ['-period__evaluation_date', '-score']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a promotion recommendation"""
        recommendation = self.get_object()
        recommendation.is_approved = True
        recommendation.approved_by = request.user
        recommendation.approved_at = timezone.now()
        recommendation.save()
        
        # Create promotion history record
        PromotionHistory.objects.create(
            officer=recommendation.officer,
            previous_rank=recommendation.officer.rank,
            new_rank=recommendation.rank_eligible_for or recommendation.officer.rank,
            promotion_date=timezone.now().date(),
            effective_date=timezone.now().date(),
            recommendation=recommendation,
            approved_by=request.user
        )
        
        return Response({'status': 'approved'})


class PromotionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromotionHistory.objects.select_related('officer', 'recommendation', 'approved_by')
    serializer_class = PromotionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer']
    search_fields = ['officer__first_name', 'officer__last_name', 'promotion_order_number']
    ordering_fields = ['promotion_date', 'effective_date']
    ordering = ['-promotion_date']


# Helper import
from django.db.models import Count, Max, Min, Avg
from django.utils import timezone
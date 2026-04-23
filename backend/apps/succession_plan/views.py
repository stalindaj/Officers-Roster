from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import SuccessionPlan, TransitionLog
from .serializers import SuccessionPlanSerializer, SuccessionPlanCreateSerializer, TransitionLogSerializer

class SuccessionPlanViewSet(viewsets.ModelViewSet):
    queryset = SuccessionPlan.objects.select_related(
        'unit', 'position', 'current_officer', 'proposed_officer'
    )
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['unit', 'position', 'status', 'priority']
    search_fields = ['unit__unit_code', 'position__position_title', 'remarks']
    ordering_fields = ['priority', 'target_date', 'created_at']
    ordering = ['priority', 'target_date']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return SuccessionPlanCreateSerializer
        return SuccessionPlanSerializer
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a succession plan"""
        plan = self.get_object()
        plan.status = 'APPROVED'
        plan.approved_by = request.user
        plan.approved_date = timezone.now().date()
        plan.save()
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Mark succession plan as in progress"""
        plan = self.get_object()
        plan.status = 'IN_PROGRESS'
        plan.save()
        return Response({'status': 'started'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark succession plan as completed and create transition log"""
        plan = self.get_object()
        
        # Create transition log
        TransitionLog.objects.create(
            succession_plan=plan,
            officer=plan.proposed_officer,
            from_unit=plan.unit if plan.current_officer else None,
            to_unit=plan.unit,
            from_position=plan.position if plan.current_officer else None,
            to_position=plan.position,
            transition_type='ROTATION',
            effective_date=timezone.now().date(),
            remarks=plan.remarks
        )
        
        plan.status = 'COMPLETED'
        plan.save()
        
        return Response({'status': 'completed'})
    
    @action(detail=False, methods=['get'])
    def by_unit(self, request):
        """Get succession plans grouped by unit"""
        unit_id = request.query_params.get('unit_id')
        queryset = self.queryset.filter(status__in=['PROPOSED', 'APPROVED', 'IN_PROGRESS'])
        
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
        
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for plan in queryset:
            grouped[plan.unit.unit_code].append({
                'position': plan.position.position_title,
                'current': plan.current_officer.full_name if plan.current_officer else 'Vacant',
                'proposed': plan.proposed_officer.full_name if plan.proposed_officer else 'TBD',
                'priority': plan.get_priority_display(),
                'target_date': plan.target_date,
                'status': plan.get_status_display()
            })
        
        return Response(dict(grouped))
    
    @action(detail=False, methods=['get'])
    def critical_positions(self, request):
        """Get high priority succession plans"""
        queryset = self.queryset.filter(
            priority__in=[1, 2],
            status__in=['PROPOSED', 'APPROVED']
        ).order_by('priority', 'target_date')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class TransitionLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TransitionLog.objects.select_related(
        'officer', 'from_unit', 'to_unit', 'from_position', 'to_position'
    )
    serializer_class = TransitionLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['officer', 'transition_type', 'from_unit', 'to_unit']
    search_fields = ['officer__first_name', 'officer__last_name', 'order_number']
    ordering_fields = ['effective_date']
    ordering = ['-effective_date']
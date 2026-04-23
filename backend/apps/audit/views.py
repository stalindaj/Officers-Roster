from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from datetime import datetime, timedelta
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogFilterSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing audit logs
    Only accessible by superadmin and admin users
    """
    queryset = AuditLog.objects.select_related('user')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['action', 'table_name', 'user']
    search_fields = ['username', 'description', 'record_id']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Restrict access based on user role"""
        queryset = super().get_queryset()
        user = self.request.user
        
        # Superadmin and admin can see all logs
        if user.role in ['superadmin', 'admin']:
            return queryset
        
        # Operations can only see logs related to their actions
        return queryset.filter(user=user)
    
    @action(detail=False, methods=['get'])
    def by_table(self, request):
        """Get audit logs grouped by table"""
        table_name = request.query_params.get('table_name')
        if not table_name:
            return Response({'error': 'table_name required'}, status=status.HTTP_400_BAD_REQUEST)
        
        logs = self.get_queryset().filter(table_name=table_name)
        
        # Group by record_id
        from collections import defaultdict
        grouped = defaultdict(list)
        
        for log in logs:
            grouped[log.record_id].append({
                'action': log.get_action_display(),
                'user': log.username,
                'timestamp': log.created_at,
                'description': log.description,
                'changed_fields': log.changed_fields
            })
        
        return Response(dict(grouped))
    
    @action(detail=False, methods=['get'])
    def for_record(self, request):
        """Get all audit logs for a specific record"""
        table_name = request.query_params.get('table_name')
        record_id = request.query_params.get('record_id')
        
        if not table_name or not record_id:
            return Response({'error': 'table_name and record_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        logs = self.get_queryset().filter(
            table_name=table_name,
            record_id=record_id
        ).order_by('created_at')
        
        serializer = self.get_serializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def changes_by_user(self, request):
        """Get summary of changes made by each user"""
        user_id = request.query_params.get('user_id')
        
        queryset = self.get_queryset().filter(action='UPDATE')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        summary = queryset.values('user__username').annotate(
            total_changes=Count('id')
        ).order_by('-total_changes')
        
        return Response(summary)
    
    @action(detail=False, methods=['get'])
    def activity_summary(self, request):
        """Get activity summary for a date range"""
        days = int(request.query_params.get('days', 7))
        start_date = datetime.now().date() - timedelta(days=days)
        
        logs = self.get_queryset().filter(created_at__date__gte=start_date)
        
        # Daily activity
        daily = logs.extra({'date': "date(created_at)"}).values('date').annotate(
            count=Count('id')
        ).order_by('-date')
        
        # By action
        by_action = logs.values('action').annotate(count=Count('id')).order_by('-count')
        
        # By user
        by_user = logs.values('username').annotate(count=Count('id')).order_by('-count')[:10]
        
        return Response({
            'period': f'Last {days} days',
            'daily_activity': daily,
            'by_action': by_action,
            'top_users': by_user,
            'total_activities': logs.count()
        })
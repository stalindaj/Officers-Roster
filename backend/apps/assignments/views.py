from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
from .models import Assignment
from .serializers import AssignmentSerializer, AssignmentCreateSerializer

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('officer', 'unit', 'position')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['officer', 'unit', 'position', 'assignment_type']
    search_fields = ['officer__first_name', 'officer__last_name', 'remarks']
    ordering_fields = ['date_assumed', 'date_relinquished']
    ordering = ['-date_assumed']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AssignmentCreateSerializer
        return AssignmentSerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get all current assignments"""
        current_assignments = self.queryset.filter(date_relinquished__isnull=True)
        serializer = self.get_serializer(current_assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def end_assignment(self, request, pk=None):
        """End a current assignment"""
        assignment = self.get_object()
        assignment.date_relinquished = request.data.get('date_relinquished')
        assignment.save()
        return Response({'status': 'assignment ended'})
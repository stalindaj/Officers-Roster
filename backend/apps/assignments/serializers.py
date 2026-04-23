from rest_framework import serializers
from .models import Assignment

class AssignmentSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    unit_code = serializers.CharField(source='unit.unit_code', read_only=True)
    position_title = serializers.CharField(source='position.position_title', read_only=True)
    is_current = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)
    duration_display = serializers.ReadOnlyField(source='duration_years_months_days')
    
    class Meta:
        model = Assignment
        fields = ['id', 'officer', 'officer_name', 'unit', 'unit_code', 
                  'position', 'position_title', 'date_assumed', 'date_relinquished',
                  'assignment_type', 'is_current', 'duration_days', 'duration_display',
                  'remarks', 'created_at']
        read_only_fields = ['created_at', 'updated_at']

class AssignmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ['officer', 'unit', 'position', 'date_assumed', 'date_relinquished',
                  'assignment_type', 'remarks']
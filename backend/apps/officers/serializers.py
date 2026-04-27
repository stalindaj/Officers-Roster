from rest_framework import serializers
from .models import Officer

class OfficerBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Officer
        fields = ['id', 'paf_number', 'rank', 'first_name', 'last_name', 'full_name']

class OfficerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_flight_hours = serializers.ReadOnlyField()
    current_assignment = serializers.SerializerMethodField()
    career_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Officer
        fields = ['id', 'paf_number', 'rank', 'first_name', 'last_name', 
                  'middle_name', 'suffix', 'full_name', 'status', 'date_commissioned',
                  'total_flight_hours', 'current_assignment', 'career_history']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_current_assignment(self, obj):
        assignment = obj.current_assignment
        if assignment:
            return {
                'id': assignment.id,
                'unit': {
                    'id': assignment.unit.id, 
                    'unit_code': assignment.unit.unit_code
                } if assignment.unit else None,
                'position': {
                    'id': assignment.position.id, 
                    'position_title': assignment.position.position_title
                } if assignment.position else None,
                'date_assumed': assignment.date_assumed,
                'date_relinquished': assignment.date_relinquished,
                'assignment_type': assignment.assignment_type
            }
        return None
    
    def get_career_history(self, obj):
        assignments = obj.assignments.all().select_related('unit', 'position').order_by('-date_assumed')
        return [
            {
                'id': a.id,
                'unit': {
                    'id': a.unit.id, 
                    'unit_code': a.unit.unit_code
                } if a.unit else None,
                'position': {
                    'id': a.position.id, 
                    'position_title': a.position.position_title
                } if a.position else None,
                'date_assumed': a.date_assumed,
                'date_relinquished': a.date_relinquished,
                'assignment_type': a.assignment_type
            }
            for a in assignments
        ]

class OfficerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_flight_hours = serializers.ReadOnlyField()
    current_assignment = serializers.SerializerMethodField()
    career_history = serializers.SerializerMethodField()
    
    class Meta:
        model = Officer
        fields = '__all__'
    
    def get_current_assignment(self, obj):
        assignment = obj.current_assignment
        if assignment:
            return {
                'id': assignment.id,
                'unit': {
                    'id': assignment.unit.id, 
                    'unit_code': assignment.unit.unit_code
                } if assignment.unit else None,
                'position': {
                    'id': assignment.position.id, 
                    'position_title': assignment.position.position_title
                } if assignment.position else None,
                'date_assumed': assignment.date_assumed,
                'date_relinquished': assignment.date_relinquished,
                'assignment_type': assignment.assignment_type
            }
        return None
    
    def get_career_history(self, obj):
        assignments = obj.assignments.all().select_related('unit', 'position').order_by('-date_assumed')
        return [
            {
                'id': a.id,
                'unit': {
                    'id': a.unit.id, 
                    'unit_code': a.unit.unit_code
                } if a.unit else None,
                'position': {
                    'id': a.position.id, 
                    'position_title': a.position.position_title
                } if a.position else None,
                'date_assumed': a.date_assumed,
                'date_relinquished': a.date_relinquished,
                'assignment_type': a.assignment_type
            }
            for a in assignments
        ]
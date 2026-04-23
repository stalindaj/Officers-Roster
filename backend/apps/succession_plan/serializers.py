from rest_framework import serializers
from .models import SuccessionPlan, TransitionLog
from apps.officers.serializers import OfficerBasicSerializer
from apps.units.serializers import UnitSerializer
from apps.positions.serializers import PositionSerializer

class SuccessionPlanSerializer(serializers.ModelSerializer):
    unit_code = serializers.CharField(source='unit.unit_code', read_only=True)
    position_title = serializers.CharField(source='position.position_title', read_only=True)
    current_officer_name = serializers.CharField(source='current_officer.full_name', read_only=True, allow_null=True)
    proposed_officer_name = serializers.CharField(source='proposed_officer.full_name', read_only=True, allow_null=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = SuccessionPlan
        fields = [
            'id', 'unit', 'unit_code', 'position', 'position_title',
            'current_officer', 'current_officer_name',
            'proposed_officer', 'proposed_officer_name',
            'priority', 'priority_display', 'target_date',
            'expected_relinquish_date', 'status', 'status_display',
            'remarks', 'proposed_by', 'proposed_date',
            'approved_by', 'approved_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class SuccessionPlanCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuccessionPlan
        fields = [
            'unit', 'position', 'current_officer', 'proposed_officer',
            'priority', 'target_date', 'expected_relinquish_date',
            'status', 'remarks', 'proposed_by', 'proposed_date'
        ]


class TransitionLogSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    from_unit_code = serializers.CharField(source='from_unit.unit_code', read_only=True, allow_null=True)
    to_unit_code = serializers.CharField(source='to_unit.unit_code', read_only=True, allow_null=True)
    from_position_title = serializers.CharField(source='from_position.position_title', read_only=True, allow_null=True)
    to_position_title = serializers.CharField(source='to_position.position_title', read_only=True, allow_null=True)
    transition_type_display = serializers.CharField(source='get_transition_type_display', read_only=True)
    
    class Meta:
        model = TransitionLog
        fields = [
            'id', 'succession_plan', 'officer', 'officer_name',
            'from_unit', 'from_unit_code', 'to_unit', 'to_unit_code',
            'from_position', 'from_position_title', 'to_position', 'to_position_title',
            'transition_type', 'transition_type_display', 'effective_date',
            'order_number', 'remarks', 'created_at'
        ]
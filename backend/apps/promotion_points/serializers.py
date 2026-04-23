from rest_framework import serializers
from .models import PromotionPeriod, PromotionPoints, PromotionRecommendation, PromotionHistory
from apps.officers.serializers import OfficerBasicSerializer

class PromotionPeriodSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PromotionPeriod
        fields = '__all__'


class PromotionPointsSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    period_name = serializers.CharField(source='period.period_name', read_only=True)
    command_total_points = serializers.DecimalField(max_digits=6, decimal_places=3, read_only=True)
    is_promotable_to_command = serializers.BooleanField(read_only=True)
    is_promotable_to_senior = serializers.BooleanField(read_only=True)
    recommended_promotion = serializers.CharField(read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PromotionPoints
        fields = [
            'id', 'officer', 'officer_name', 'period', 'period_name',
            'qualification_points', 'qualification_remarks',
            'instructor_points', 'instructor_remarks',
            'special_duties_points', 'special_duties_remarks',
            'command_o4_points', 'command_o5_points', 'command_remarks',
            'command_total_points', 'total_points',
            'flying_hours', 'flying_rating', 'remarks',
            'evaluated_by', 'evaluated_by_name', 'evaluation_notes',
            'is_promotable_to_command', 'is_promotable_to_senior', 'recommended_promotion',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_points', 'created_at', 'updated_at']


class PromotionPointsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionPoints
        fields = [
            'officer', 'period', 'qualification_points', 'qualification_remarks',
            'instructor_points', 'instructor_remarks', 'special_duties_points',
            'special_duties_remarks', 'command_o4_points', 'command_o5_points',
            'command_remarks', 'flying_hours', 'flying_rating', 'remarks',
            'evaluated_by', 'evaluation_notes'
        ]


class PromotionRecommendationSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    period_name = serializers.CharField(source='period.period_name', read_only=True)
    recommendation_display = serializers.CharField(source='get_recommendation_display', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PromotionRecommendation
        fields = '__all__'


class PromotionHistorySerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = PromotionHistory
        fields = '__all__'


class PromotionBoardReportSerializer(serializers.Serializer):
    """Serializer for promotion board report"""
    officer_id = serializers.IntegerField()
    officer_name = serializers.CharField()
    rank = serializers.CharField()
    period = serializers.CharField()
    total_points = serializers.DecimalField(max_digits=6, decimal_places=3)
    qualification = serializers.DecimalField(max_digits=5, decimal_places=3)
    instructor = serializers.DecimalField(max_digits=5, decimal_places=3)
    special_duties = serializers.DecimalField(max_digits=5, decimal_places=3)
    command = serializers.DecimalField(max_digits=5, decimal_places=3)
    flying_hours = serializers.DecimalField(max_digits=8, decimal_places=1, allow_null=True)
    rating = serializers.CharField()
    recommendation = serializers.CharField()
    status = serializers.CharField()
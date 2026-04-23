from rest_framework import serializers
from .models import QualificationType, Qualification, Rating, InstructorSpecialty, SpecialDuty
from apps.officers.serializers import OfficerBasicSerializer
from apps.flight_logs.serializers import AircraftTypeSerializer

class QualificationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualificationType
        fields = '__all__'

class QualificationSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    qualification_name = serializers.CharField(source='qualification_type.qualification_name', read_only=True)
    is_active_status = serializers.BooleanField(source='is_active', read_only=True)
    score_percentage = serializers.DecimalField(max_digits=6, decimal_places=2, read_only=True)
    
    class Meta:
        model = Qualification
        fields = [
            'id', 'officer', 'officer_name', 'qualification_type', 'qualification_name',
            'date_earned', 'expiry_date', 'date_renewed', 'score', 'max_possible_score',
            'score_percentage', 'issuing_authority', 'certificate_number', 'remarks', 
            'status', 'is_active_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class QualificationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Qualification
        fields = [
            'officer', 'qualification_type', 'date_earned', 'expiry_date', 'date_renewed',
            'score', 'max_possible_score', 'issuing_authority', 'certificate_number', 
            'remarks', 'status'
        ]

class RatingSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    rating_level_display = serializers.CharField(source='get_rating_level_display', read_only=True)
    certified_by_name = serializers.CharField(source='certified_by.full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Rating
        fields = [
            'id', 'officer', 'officer_name', 'rating_level', 'rating_level_display',
            'date_achieved', 'certified_by', 'certified_by_name', 'remarks', 'created_at'
        ]
        read_only_fields = ['created_at']

class InstructorSpecialtySerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    aircraft_details = AircraftTypeSerializer(source='aircraft_type', read_only=True)
    
    class Meta:
        model = InstructorSpecialty
        fields = [
            'id', 'officer', 'officer_name', 'aircraft_type', 'aircraft_details',
            'specialty_name', 'date_qualified', 'is_current', 'remarks'
        ]

class SpecialDutySerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    
    class Meta:
        model = SpecialDuty
        fields = [
            'id', 'officer', 'officer_name', 'duty_name', 'duty_code', 'points_value',
            'start_date', 'end_date', 'is_current', 'remarks'
        ]
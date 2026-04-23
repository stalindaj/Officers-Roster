from rest_framework import serializers
from .models import AircraftType, FlightType, MissionType, FlightLog, FlightSummary
from apps.officers.serializers import OfficerBasicSerializer

class AircraftTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AircraftType
        fields = '__all__'

class FlightTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightType
        fields = '__all__'

class MissionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionType
        fields = '__all__'

class FlightLogSerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    aircraft_code = serializers.CharField(source='aircraft.aircraft_code', read_only=True)
    flight_type_name = serializers.CharField(source='flight_type.flight_type_name', read_only=True)
    mission_name = serializers.CharField(source='mission_type.mission_name', read_only=True)
    adjusted_hours = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    
    class Meta:
        model = FlightLog
        fields = [
            'id', 'officer', 'officer_name', 'aircraft', 'aircraft_code',
            'flight_type', 'flight_type_name', 'mission_type', 'mission_name',
            'flight_date', 'flight_hours', 'adjusted_hours', 'sortie_number',
            'takeoff_time', 'landing_time', 'is_night_flight', 'is_instrument_flight',
            'is_simulator', 'passenger_count', 'cargo_weight_kg', 'remarks',
            'certifying_officer', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class FlightLogCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightLog
        fields = [
            'officer', 'aircraft', 'flight_type', 'mission_type', 'flight_date',
            'flight_hours', 'sortie_number', 'takeoff_time', 'landing_time',
            'is_night_flight', 'is_instrument_flight', 'is_simulator',
            'passenger_count', 'cargo_weight_kg', 'remarks', 'certifying_officer'
        ]

class FlightSummarySerializer(serializers.ModelSerializer):
    officer_name = serializers.CharField(source='officer.full_name', read_only=True)
    
    class Meta:
        model = FlightSummary
        fields = [
            'id', 'officer', 'officer_name', 'total_flight_hours', 'total_night_hours',
            'total_instrument_hours', 'total_simulator_hours', 'total_flights',
            'total_night_flights', 'total_instrument_flights', 'last_flight_date'
        ]
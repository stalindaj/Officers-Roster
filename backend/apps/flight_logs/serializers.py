from rest_framework import serializers
from .models import FlightLog


class FlightLogSerializer(serializers.ModelSerializer):
    officer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FlightLog
        fields = ['id', 'officer', 'officer_name', 'flight_date', 'flight_hours', 
                  'aircraft_type', 'mission_type', 'remarks']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_officer_name(self, obj):
        return str(obj.officer)
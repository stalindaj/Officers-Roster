from rest_framework import serializers
from .models import Officer

class OfficerBasicSerializer(serializers.ModelSerializer):
    """Basic serializer for officer - used in other apps"""
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Officer
        fields = ['id', 'paf_number', 'rank', 'first_name', 'last_name', 'full_name']

class OfficerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = Officer
        fields = ['id', 'paf_number', 'rank', 'first_name', 'last_name', 
                  'middle_name', 'suffix', 'full_name', 'status', 'date_commissioned']
        read_only_fields = ['id', 'created_at', 'updated_at']

class OfficerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    total_flight_hours = serializers.ReadOnlyField()
    current_assignment = serializers.ReadOnlyField()
    
    class Meta:
        model = Officer
        fields = '__all__'
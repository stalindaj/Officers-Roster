from rest_framework import serializers
from .models import Unit

class UnitSerializer(serializers.ModelSerializer):
    parent_unit_code = serializers.CharField(source='parent_unit.unit_code', read_only=True)
    full_hierarchy = serializers.ReadOnlyField()
    
    class Meta:
        model = Unit
        fields = ['id', 'unit_code', 'unit_name', 'unit_type', 'parent_unit', 
                  'parent_unit_code', 'full_hierarchy', 'is_active']
        read_only_fields = ['id', 'created_at']
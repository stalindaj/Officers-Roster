from rest_framework import serializers
from .models import Position

class PositionSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_position_category_display', read_only=True)
    
    class Meta:
        model = Position
        fields = ['id', 'position_code', 'position_title', 'rank_authorized', 
                  'position_category', 'category_display', 'promotion_points_value']
        read_only_fields = ['id', 'created_at']
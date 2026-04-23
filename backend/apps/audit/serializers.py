from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True, allow_null=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_name', 'username', 'action', 'action_display',
            'table_name', 'record_id', 'old_data', 'new_data', 'changed_fields',
            'description', 'user_ip', 'user_agent', 'request_method', 
            'request_path', 'response_status', 'created_at'
        ]
        read_only_fields = '__all__'


class AuditLogFilterSerializer(serializers.Serializer):
    """Serializer for filtering audit logs"""
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    user_id = serializers.IntegerField(required=False)
    action = serializers.ChoiceField(choices=AuditLog.ACTION_CHOICES, required=False)
    table_name = serializers.CharField(required=False)
    record_id = serializers.CharField(required=False)
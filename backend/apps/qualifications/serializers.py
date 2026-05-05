from rest_framework import serializers
from .models import Qualification


class QualificationSerializer(serializers.ModelSerializer):
    officer_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Qualification
        fields = ['id', 'officer', 'officer_name', 'qualification_type', 'name', 
                  'date_earned', 'expiration_date', 'issuing_authority', 
                  'certificate_number', 'status', 'description']
        read_only_fields = ['id']
    
    def get_officer_name(self, obj):
        return str(obj.officer)
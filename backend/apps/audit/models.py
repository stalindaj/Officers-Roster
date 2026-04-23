from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from simple_history.models import HistoricalRecords

class AuditLog(models.Model):
    """
    Comprehensive audit log for all critical operations
    Tracks who did what, when, and what changed
    """
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('VIEW', 'View'),
        ('LOGIN', 'Login'),
        ('LOGOUT', 'Logout'),
        ('EXPORT', 'Export'),
        ('IMPORT', 'Import'),
        ('APPROVE', 'Approve'),
        ('REJECT', 'Reject'),
    ]
    
    id = models.AutoField(primary_key=True)
    
    # Who performed the action
    user = models.ForeignKey('users.User', on_delete=models.SET_NULL, 
                             null=True, blank=True, related_name='audit_logs')
    username = models.CharField(max_length=150, blank=True, help_text="Username at time of action")
    user_ip = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, help_text="Browser/Client info")
    
    # What action was performed
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    table_name = models.CharField(max_length=100, db_index=True, help_text="Database table affected")
    record_id = models.CharField(max_length=50, blank=True, db_index=True, help_text="ID of the affected record")
    
    # What changed (for UPDATE actions)
    old_data = models.JSONField(null=True, blank=True, help_text="Before state")
    new_data = models.JSONField(null=True, blank=True, help_text="After state")
    changed_fields = models.JSONField(null=True, blank=True, help_text="List of fields that changed")
    
    # Additional context
    request_method = models.CharField(max_length=10, blank=True)  # GET, POST, PUT, DELETE
    request_path = models.CharField(max_length=500, blank=True)
    response_status = models.IntegerField(null=True, blank=True)
    
    # Description
    description = models.TextField(blank=True, help_text="Human readable description of the action")
    details = models.JSONField(null=True, blank=True, help_text="Additional details")
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['table_name', 'record_id']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.created_at} - {self.user} - {self.action} - {self.table_name}"
    
    @classmethod
    def log_create(cls, user, instance, request=None, description=""):
        """Log a CREATE action"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='CREATE',
            table_name=instance._meta.db_table,
            record_id=str(instance.id),
            new_data=cls._serialize_instance(instance),
            request_path=request.path if request else '',
            request_method=request.method if request else '',
            description=description or f"Created {instance._meta.verbose_name}: {instance}",
            details={'model': instance._meta.model_name}
        )
    
    @classmethod
    def log_update(cls, user, instance, old_instance, changed_fields, request=None, description=""):
        """Log an UPDATE action"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='UPDATE',
            table_name=instance._meta.db_table,
            record_id=str(instance.id),
            old_data=cls._serialize_instance(old_instance),
            new_data=cls._serialize_instance(instance),
            changed_fields=changed_fields,
            request_path=request.path if request else '',
            request_method=request.method if request else '',
            description=description or f"Updated {instance._meta.verbose_name}: {instance}",
            details={'model': instance._meta.model_name, 'changed_fields': changed_fields}
        )
    
    @classmethod
    def log_delete(cls, user, instance, request=None, description=""):
        """Log a DELETE action"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='DELETE',
            table_name=instance._meta.db_table,
            record_id=str(instance.id),
            old_data=cls._serialize_instance(instance),
            request_path=request.path if request else '',
            request_method=request.method if request else '',
            description=description or f"Deleted {instance._meta.verbose_name}: {instance}",
            details={'model': instance._meta.model_name}
        )
    
    @classmethod
    def log_view(cls, user, table_name, record_id, request=None, description=""):
        """Log a VIEW action (optional - can be filtered)"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='VIEW',
            table_name=table_name,
            record_id=str(record_id),
            request_path=request.path if request else '',
            request_method=request.method if request else '',
            description=description or f"Viewed {table_name} record {record_id}",
        )
    
    @classmethod
    def log_login(cls, user, request=None, success=True):
        """Log user login attempts"""
        return cls.objects.create(
            user=user if success else None,
            username=user.username if user else request.POST.get('username', 'UNKNOWN'),
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='LOGIN',
            table_name='auth_user',
            record_id=str(user.id) if user else '',
            description=f"{'Successful' if success else 'Failed'} login for {user.username if user else request.POST.get('username', 'UNKNOWN')}",
            response_status=200 if success else 401
        )
    
    @classmethod
    def log_export(cls, user, export_type, record_count, request=None, description=""):
        """Log data exports"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='EXPORT',
            table_name=export_type,
            description=description or f"Exported {record_count} records from {export_type}",
            details={'record_count': record_count, 'export_type': export_type}
        )
    
    @classmethod
    def log_import(cls, user, import_type, record_count, request=None, description=""):
        """Log data imports"""
        return cls.objects.create(
            user=user,
            username=user.username if user else 'SYSTEM',
            user_ip=cls._get_client_ip(request),
            user_agent=cls._get_user_agent(request),
            action='IMPORT',
            table_name=import_type,
            description=description or f"Imported {record_count} records to {import_type}",
            details={'record_count': record_count, 'import_type': import_type}
        )
    
    @staticmethod
    def _serialize_instance(instance):
        """Convert model instance to dict for JSON storage"""
        if not instance:
            return None
        
        # Exclude large binary fields and sensitive data
        exclude_fields = ['password', 'user_ptr']
        data = {}
        for field in instance._meta.fields:
            if field.name not in exclude_fields:
                value = getattr(instance, field.name)
                # Handle datetime and date objects
                if hasattr(value, 'isoformat'):
                    value = value.isoformat()
                data[field.name] = str(value) if value else None
        return data
    
    @staticmethod
    def _get_client_ip(request):
        """Extract client IP from request"""
        if not request:
            return None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    @staticmethod
    def _get_user_agent(request):
        """Extract user agent from request"""
        if not request:
            return ''
        return request.META.get('HTTP_USER_AGENT', '')[:500]


class AuditMiddleware(models.Model):
    """
    Model to store middleware configuration for audit
    This is a helper model, not used for storing audit data
    """
    class Meta:
        managed = False
        db_table = 'audit_middleware_config'
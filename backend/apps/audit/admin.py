from django.contrib import admin
from .models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'user', 'action', 'table_name', 'record_id', 'description')
    list_filter = ('action', 'table_name', 'created_at')
    search_fields = ('username', 'description', 'record_id', 'user__username')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'user', 'username', 'action', 'table_name', 
                       'record_id', 'old_data', 'new_data', 'changed_fields', 
                       'description', 'user_ip', 'user_agent')
    
    fieldsets = (
        ('Action Info', {'fields': ('user', 'username', 'action', 'table_name', 'record_id', 'description')}),
        ('Data Changes', {'fields': ('old_data', 'new_data', 'changed_fields')}),
        ('Request Info', {'fields': ('user_ip', 'user_agent', 'request_method', 'request_path', 'response_status')}),
        ('Metadata', {'fields': ('details', 'created_at')}),
    )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        # Only superuser can delete audit logs
        return request.user.is_superuser
from django.utils.deprecation import MiddlewareMixin
from .models import AuditLog

class AuditMiddleware(MiddlewareMixin):
    """
    Middleware to automatically log all requests
    """
    
    def process_request(self, request):
        """Store request info for later logging"""
        request.audit_start_time = timezone.now()
    
    def process_response(self, request, response):
        """Log the request/response if needed"""
        # Only log specific paths
        audit_paths = ['/api/officers/', '/api/assignments/', '/api/flight-logs/', 
                       '/api/promotion-points/', '/api/qualifications/']
        
        should_audit = any(request.path.startswith(path) for path in audit_paths)
        
        if should_audit and hasattr(request, 'user') and request.user.is_authenticated:
            # Log view actions for sensitive data (optional - can be filtered)
            if request.method == 'GET' and 'export' not in request.path:
                AuditLog.log_view(
                    user=request.user,
                    table_name=request.path.split('/')[2] if len(request.path.split('/')) > 2 else 'unknown',
                    record_id=request.GET.get('id', ''),
                    request=request,
                    description=f"Viewed {request.path}"
                )
        
        return response


# Import for timezone
from django.utils import timezone
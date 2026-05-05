# backend/apps/common/permissions.py (create this file)
from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow admins to edit, others can only view"""
    
    def has_permission(self, request, view):
        # Allow GET, HEAD, OPTIONS for everyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Only allow admin/superadmin for write operations
        return request.user and request.user.is_authenticated and (
            request.user.role in ['admin', 'superadmin']
        )

class IsAdminOnly(permissions.BasePermission):
    """Only admin/superadmin can access"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in ['admin', 'superadmin']
        )
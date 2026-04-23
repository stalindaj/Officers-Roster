from django.db import models
from django.contrib.auth.models import AbstractUser
from simple_history.models import HistoricalRecords

class User(AbstractUser):
    """
    Custom User model with roles for the officer tracking system
    """
    ROLE_CHOICES = [
        ('superadmin', 'Super Administrator'),
        ('admin', 'Administrator'),
        ('operations', 'Operations'),
        ('viewer', 'Viewer'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')
    middle_name = models.CharField(max_length=100, blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    
    # Audit tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Historical record for audit
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_superadmin(self):
        return self.role == 'superadmin' or self.is_superuser
    
    @property
    def can_edit(self):
        return self.role in ['superadmin', 'admin']
    
    @property
    def can_view_all(self):
        return self.role in ['superadmin', 'admin', 'operations']
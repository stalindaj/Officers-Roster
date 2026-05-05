from django.db import models
from simple_history.models import HistoricalRecords
from apps.officers.models import Officer


class Qualification(models.Model):
    QUALIFICATION_TYPES = [
        ('PILOT', 'Pilot'),
        ('NAVIGATOR', 'Navigator'),
        ('INSTRUCTOR', 'Instructor'),
        ('COMMAND', 'Command'),
        ('STAFF', 'Staff'),
        ('SPECIAL_OPS', 'Special Operations'),
        ('MAINTENANCE', 'Maintenance'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('REVOKED', 'Revoked'),
    ]
    
    officer = models.ForeignKey(Officer, on_delete=models.CASCADE, related_name='qualifications')
    qualification_type = models.CharField(max_length=50, choices=QUALIFICATION_TYPES)
    name = models.CharField(max_length=200, default='')  # ADDED default=''
    date_earned = models.DateField(default='2024-01-01')  # ADDED default
    expiration_date = models.DateField(null=True, blank=True)
    issuing_authority = models.CharField(max_length=200, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    description = models.TextField(blank=True, default='')  # ADDED default=''
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'qualifications'
        ordering = ['-date_earned']
    
    def __str__(self):
        return f"{self.officer} - {self.name}"
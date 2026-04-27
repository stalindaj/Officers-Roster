from django.db import models
from django.contrib.auth import get_user_model
from simple_history.models import HistoricalRecords

User = get_user_model()

class Request(models.Model):
    """
    Request for data changes that need approval
    """
    REQUEST_TYPES = [
        ('OFFICER_CREATE', 'Create Officer'),
        ('OFFICER_UPDATE', 'Update Officer'),
        ('OFFICER_DELETE', 'Delete Officer'),
        ('FLIGHT_HOURS_ADD', 'Add Flight Hours'),
        ('FLIGHT_HOURS_UPDATE', 'Update Flight Hours'),
        ('ASSIGNMENT_ADD', 'Add Assignment'),
        ('ASSIGNMENT_UPDATE', 'Update Assignment'),
        ('PROMOTION_POINTS_ADD', 'Add Promotion Points'),
        ('QUALIFICATION_ADD', 'Add Qualification'),
        ('BULK_IMPORT', 'Bulk Import from Excel'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('IN_REVIEW', 'In Review'),
    ]
    
    id = models.AutoField(primary_key=True)
    request_type = models.CharField(max_length=50, choices=REQUEST_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # The data being requested (JSON format)
    data = models.JSONField(help_text='The proposed changes in JSON format')
    
    # Original data for updates (to show before/after)
    original_data = models.JSONField(null=True, blank=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Relationships
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_requests')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_requests')
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # For bulk imports
    file_path = models.CharField(max_length=500, blank=True, null=True)
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.get_request_type_display()} - {self.title} ({self.get_status_display()})"


class RequestFile(models.Model):
    """
    Files attached to requests for verification
    """
    id = models.AutoField(primary_key=True)
    request = models.ForeignKey(Request, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='request_files/%Y/%m/%d/')
    filename = models.CharField(max_length=255)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'request_files'
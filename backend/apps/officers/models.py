from django.db import models
from simple_history.models import HistoricalRecords
from django.core.validators import MinValueValidator, MaxValueValidator

class Officer(models.Model):
    """
    Master table for all officers/personnel
    """
    RANK_CHOICES = [
        ('LTC', 'Lieutenant Colonel'),
        ('MAJ', 'Major'),
        ('CPT', 'Captain'),
        ('1LT', '1st Lieutenant'),
        ('2LT', '2nd Lieutenant'),
        ('CDR', 'Commander'),
        ('LTCDR', 'Lieutenant Commander'),
        ('LT', 'Lieutenant'),
        ('LTJG', 'Lieutenant Junior Grade'),
        ('ENS', 'Ensign'),
    ]
    
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('RETIRED', 'Retired'),
        ('DECEASED', 'Deceased'),
        ('ON_LEAVE', 'On Leave'),
        ('SUSPENDED', 'Suspended'),
    ]
    
    # Primary identifier
    id = models.AutoField(primary_key=True)
    paf_number = models.CharField(max_length=50, unique=True, blank=True, null=True, help_text="PAF O-number like O-135535")
    
    # Personal information
    rank = models.CharField(max_length=20, choices=RANK_CHOICES)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    suffix = models.CharField(max_length=20, blank=True, help_text="Jr., Sr., III, etc.")
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    date_commissioned = models.DateField(null=True, blank=True)
    date_birth = models.DateField(null=True, blank=True)
    
    # Computed fields (not stored, but available as properties)
    # full_name, total_flight_hours, current_assignment
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    
    # Historical record for audit
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'officers'
        verbose_name = 'Officer'
        verbose_name_plural = 'Officers'
        ordering = ['rank', 'last_name', 'first_name']
        indexes = [
            models.Index(fields=['paf_number']),
            models.Index(fields=['rank', 'status']),
            models.Index(fields=['last_name', 'first_name']),
        ]
    
    def __str__(self):
        suffix_str = f" {self.suffix}" if self.suffix else ""
        return f"{self.rank} {self.first_name} {self.last_name}{suffix_str}"
    
    @property
    def full_name(self):
        suffix_str = f" {self.suffix}" if self.suffix else ""
        middle_str = f" {self.middle_name}" if self.middle_name else ""
        return f"{self.rank} {self.first_name}{middle_str} {self.last_name}{suffix_str}"
    
    @property
    def total_flight_hours(self):
        """Calculate total flight hours from flight_logs"""
        return self.flight_logs.aggregate(total=models.Sum('flight_hours'))['total'] or 0
    
    @property
    def current_assignment(self):
        """Get current assignment (where date_relinquished is NULL)"""
        return self.assignments.filter(date_relinquished__isnull=True).first()
    
    @property
    def career_history(self):
        """Get all assignments ordered by date"""
        return self.assignments.select_related('unit', 'position').order_by('-date_assumed')
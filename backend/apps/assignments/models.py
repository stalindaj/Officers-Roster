from django.db import models
from django.core.exceptions import ValidationError
from simple_history.models import HistoricalRecords
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateTimeRangeField
from psycopg2.extras import DateRange

class Assignment(models.Model):
    """
    Assignment history - the most important table.
    Tracks where each officer worked, when, and in what position.
    """
    ASSIGNMENT_TYPE_CHOICES = [
        ('PERMANENT', 'Permanent'),
        ('ACTING', 'Acting'),
        ('TEMPORARY', 'Temporary'),
        ('DETAILED', 'Detailed'),
        ('DS', 'DS (Detail to Other Unit)'),
    ]
    
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, related_name='assignments')
    unit = models.ForeignKey('units.Unit', on_delete=models.CASCADE, related_name='assignments')
    position = models.ForeignKey('positions.Position', on_delete=models.CASCADE, related_name='assignments')
    
    date_assumed = models.DateField()
    date_relinquished = models.DateField(null=True, blank=True, help_text="NULL means current assignment")
    assignment_type = models.CharField(max_length=20, choices=ASSIGNMENT_TYPE_CHOICES, default='PERMANENT')
    is_promotion_point_eligible = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'assignments'
        verbose_name = 'Assignment'
        verbose_name_plural = 'Assignments'
        ordering = ['-date_assumed']
        indexes = [
            models.Index(fields=['officer', '-date_assumed']),
            models.Index(fields=['unit', 'date_assumed']),
            models.Index(fields=['date_assumed', 'date_relinquished']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(date_relinquished__isnull=True) | models.Q(date_relinquished__gte=models.F('date_assumed')),
                name='relinquished_after_assumed'
            )
        ]
    
    def __str__(self):
        current = " (Current)" if self.is_current else ""
        return f"{self.officer} - {self.position} at {self.unit} ({self.date_assumed} to {self.date_relinquished or 'Present'}){current}"
    
    def clean(self):
        """Validate that dates are logical"""
        if self.date_relinquished and self.date_relinquished < self.date_assumed:
            raise ValidationError('Date relinquished cannot be before date assumed')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    @property
    def is_current(self):
        return self.date_relinquished is None
    
    @property
    def duration_days(self):
        """Calculate duration in days (computed, not stored)"""
        end_date = self.date_relinquished or models.functions.Now()
        return (end_date - self.date_assumed).days
    
    @property
    def duration_years_months_days(self):
        """Human readable duration"""
        days = self.duration_days
        years = days // 365
        months = (days % 365) // 30
        remaining_days = days % 30
        return f"{years}y, {months}m, {remaining_days}d"
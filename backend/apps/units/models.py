from django.db import models
from simple_history.models import HistoricalRecords

class Unit(models.Model):
    """
    Units/Stations where officers can be assigned
    """
    UNIT_TYPE_CHOICES = [
        ('WING', 'Wing'),
        ('GROUP', 'Group'),
        ('SQUADRON', 'Squadron'),
        ('HEADQUARTERS', 'Headquarters'),
        ('SUPPORT', 'Support Unit'),
        ('TRAINING', 'Training Unit'),
    ]
    
    id = models.AutoField(primary_key=True)
    unit_code = models.CharField(max_length=20, unique=True, help_text="e.g., 460AMG, 16AS, HAS")
    unit_name = models.CharField(max_length=200, blank=True)
    unit_type = models.CharField(max_length=20, choices=UNIT_TYPE_CHOICES, blank=True, null=True)
    parent_unit = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subunits')
    is_active = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'units'
        verbose_name = 'Unit'
        verbose_name_plural = 'Units'
        ordering = ['unit_code']
        indexes = [
            models.Index(fields=['unit_code']),
            models.Index(fields=['unit_type']),
        ]
    
    def __str__(self):
        return self.unit_code
    
    @property
    def full_hierarchy(self):
        """Get full unit hierarchy as string"""
        if self.parent_unit:
            return f"{self.parent_unit.full_hierarchy} > {self.unit_code}"
        return self.unit_code
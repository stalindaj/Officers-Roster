from django.db import models
from simple_history.models import HistoricalRecords


class Unit(models.Model):
    unit_code = models.CharField(max_length=20, unique=True)
    unit_name = models.CharField(max_length=200)
    parent_unit = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'units'
        ordering = ['unit_code']
    
    def __str__(self):
        return f"{self.unit_code} - {self.unit_name}"
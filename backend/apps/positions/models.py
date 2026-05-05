from django.db import models
from simple_history.models import HistoricalRecords


class Position(models.Model):
    POSITION_CATEGORIES = [
        ('COMMAND', 'Command'),
        ('STAFF', 'Staff'),
        ('OPERATIONS', 'Operations'),
        ('SUPPORT', 'Support'),
        ('TRAINING', 'Training'),
    ]
    
    position_code = models.CharField(max_length=50, unique=True)
    position_title = models.CharField(max_length=200)
    position_category = models.CharField(max_length=20, choices=POSITION_CATEGORIES, default='STAFF')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'positions'
        ordering = ['position_title']
    
    def __str__(self):
        return self.position_title
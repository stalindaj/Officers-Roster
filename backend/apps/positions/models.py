from django.db import models
from simple_history.models import HistoricalRecords

class Position(models.Model):
    """
    Positions/Roles that officers can hold
    """
    POSITION_CATEGORY_CHOICES = [
        ('COMMAND', 'Command'),
        ('STAFF', 'Staff'),
        ('OPERATIONS', 'Operations'),
        ('INSTRUCTOR', 'Instructor'),
        ('SPECIAL_DUTY', 'Special Duty'),
        ('SUPPORT', 'Support'),
    ]
    
    id = models.AutoField(primary_key=True)
    position_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    position_title = models.CharField(max_length=200)
    rank_authorized = models.CharField(max_length=20, blank=True, help_text="What rank typically holds this position")
    position_category = models.CharField(max_length=20, choices=POSITION_CATEGORY_CHOICES, blank=True, null=True)
    promotion_points_value = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Points this position gives for promotion")
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'positions'
        verbose_name = 'Position'
        verbose_name_plural = 'Positions'
        ordering = ['position_title']
        indexes = [
            models.Index(fields=['position_title']),
            models.Index(fields=['position_category']),
        ]
    
    def __str__(self):
        return self.position_title
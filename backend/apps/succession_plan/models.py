from django.db import models
from simple_history.models import HistoricalRecords

class SuccessionPlan(models.Model):
    """
    Succession planning from "w TO" sheet - tracks current vs proposed officers for positions
    """
    PRIORITY_CHOICES = [
        (1, 'Highest Priority'),
        (2, 'High Priority'),
        (3, 'Medium Priority'),
        (4, 'Low Priority'),
        (5, 'Lowest Priority'),
    ]
    
    STATUS_CHOICES = [
        ('PROPOSED', 'Proposed'),
        ('APPROVED', 'Approved'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('ON_HOLD', 'On Hold'),
    ]
    
    id = models.AutoField(primary_key=True)
    
    # Position and unit
    position = models.ForeignKey('positions.Position', on_delete=models.CASCADE, 
                                 related_name='succession_plans')
    unit = models.ForeignKey('units.Unit', on_delete=models.CASCADE, 
                             related_name='succession_plans')
    
    # Current and proposed officers
    current_officer = models.ForeignKey('officers.Officer', on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='current_in_succession')
    proposed_officer = models.ForeignKey('officers.Officer', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='proposed_in_succession')
    
    # Planning details
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3)
    target_date = models.DateField(null=True, blank=True, help_text="Target date for transition")
    expected_relinquish_date = models.DateField(null=True, blank=True, 
                                                 help_text="When current officer is expected to leave")
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PROPOSED')
    remarks = models.TextField(blank=True)
    
    # Approval workflow
    proposed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='proposed_successions')
    proposed_date = models.DateField(null=True, blank=True)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, blank=True, related_name='approved_successions')
    approved_date = models.DateField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'succession_plans'
        verbose_name = 'Succession Plan'
        verbose_name_plural = 'Succession Plans'
        ordering = ['priority', 'target_date']
        indexes = [
            models.Index(fields=['unit', 'position']),
            models.Index(fields=['status']),
            models.Index(fields=['target_date']),
            models.Index(fields=['current_officer']),
            models.Index(fields=['proposed_officer']),
        ]
    
    def __str__(self):
        return f"{self.unit.unit_code} - {self.position.position_title} → {self.proposed_officer or 'TBD'}"


class TransitionLog(models.Model):
    """
    Log of actual transitions that happen from succession plans
    """
    TRANSITION_TYPE_CHOICES = [
        ('PROMOTION', 'Promotion'),
        ('TRANSFER', 'Transfer'),
        ('RETIREMENT', 'Retirement'),
        ('ROTATION', 'Rotation'),
        ('TEMPORARY', 'Temporary Assignment'),
    ]
    
    id = models.AutoField(primary_key=True)
    succession_plan = models.ForeignKey(SuccessionPlan, on_delete=models.CASCADE,
                                        related_name='transition_logs')
    
    # Who moved where
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE,
                               related_name='transitions')
    from_unit = models.ForeignKey('units.Unit', on_delete=models.SET_NULL,
                                  null=True, related_name='transitions_out')
    to_unit = models.ForeignKey('units.Unit', on_delete=models.SET_NULL,
                                null=True, related_name='transitions_in')
    from_position = models.ForeignKey('positions.Position', on_delete=models.SET_NULL,
                                      null=True, related_name='transitions_from')
    to_position = models.ForeignKey('positions.Position', on_delete=models.SET_NULL,
                                    null=True, related_name='transitions_to')
    
    # Transition details
    transition_type = models.CharField(max_length=20, choices=TRANSITION_TYPE_CHOICES)
    effective_date = models.DateField()
    order_number = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, related_name='+')
    
    class Meta:
        db_table = 'transition_logs'
        verbose_name = 'Transition Log'
        verbose_name_plural = 'Transition Logs'
        ordering = ['-effective_date']
    
    def __str__(self):
        return f"{self.officer} - {self.transition_type} on {self.effective_date}"
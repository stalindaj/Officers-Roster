from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from simple_history.models import HistoricalRecords

class PromotionPeriod(models.Model):
    """
    Promotion evaluation periods (e.g., 1st Semester 2024, 2nd Semester 2024)
    """
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('CLOSED', 'Closed'),
        ('ARCHIVED', 'Archived'),
    ]
    
    id = models.AutoField(primary_key=True)
    period_name = models.CharField(max_length=100, unique=True, help_text="e.g., 1st Semester 2024")
    period_code = models.CharField(max_length=50, unique=True)
    start_date = models.DateField()
    end_date = models.DateField()
    evaluation_date = models.DateField(help_text="Date when points were evaluated")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    
    # Thresholds for promotion (can be adjusted per period)
    command_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=75.00)
    senior_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=60.00)
    basic_threshold = models.DecimalField(max_digits=5, decimal_places=2, default=50.00)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'promotion_periods'
        verbose_name = 'Promotion Period'
        verbose_name_plural = 'Promotion Periods'
        ordering = ['-evaluation_date']
    
    def __str__(self):
        return f"{self.period_name} ({self.get_status_display()})"


class PromotionPoints(models.Model):
    """
    Promotion points for officers - matches SLL sheet scoring system
    """
    id = models.AutoField(primary_key=True)
    
    # Relationships
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='promotion_points')
    period = models.ForeignKey(PromotionPeriod, on_delete=models.CASCADE, 
                               related_name='promotion_points')
    
    # Point categories (from SLL sheet)
    # QUALIFICATION (5 PTS) - Max 5 points
    qualification_points = models.DecimalField(
        max_digits=5, decimal_places=3, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        help_text="Points from qualification (max 5 pts)"
    )
    qualification_remarks = models.CharField(max_length=200, blank=True)
    
    # INSTRUCTOR DUTIES (3 PTS) - Max 3 points
    instructor_points = models.DecimalField(
        max_digits=5, decimal_places=3, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        help_text="Points from instructor duties (max 3 pts)"
    )
    instructor_remarks = models.CharField(max_length=200, blank=True)
    
    # SPECIAL DUTIES (2 PTS) - Max 2 points
    special_duties_points = models.DecimalField(
        max_digits=5, decimal_places=3, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(2)],
        help_text="Points from special duties (max 2 pts)"
    )
    special_duties_remarks = models.CharField(max_length=200, blank=True)
    
    # COMMAND DUTIES - Calculated from O-4 Pos (3 PTS) and O-5 Pos (4 PTS)
    command_o4_points = models.DecimalField(
        max_digits=5, decimal_places=3, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        help_text="Points from O-4 Position (max 3 pts)"
    )
    command_o5_points = models.DecimalField(
        max_digits=5, decimal_places=3, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(4)],
        help_text="Points from O-5 Position (max 4 pts)"
    )
    command_remarks = models.CharField(max_length=200, blank=True)
    
    # Total points (auto-calculated)
    total_points = models.DecimalField(
        max_digits=6, decimal_places=3, default=0,
        editable=False,
        help_text="Auto-calculated sum of all points"
    )
    
    # Additional info
    flying_hours = models.DecimalField(max_digits=8, decimal_places=1, null=True, blank=True)
    flying_rating = models.CharField(max_length=50, blank=True)  # COMMAND, SENIOR, BASIC
    remarks = models.TextField(blank=True)
    
    # Evaluation
    evaluated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, 
                                     null=True, blank=True, related_name='evaluated_points')
    evaluation_notes = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, 
                                   null=True, related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, 
                                   null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'promotion_points'
        verbose_name = 'Promotion Points'
        verbose_name_plural = 'Promotion Points'
        ordering = ['-period__evaluation_date', '-total_points']
        unique_together = [['officer', 'period']]  # One points record per officer per period
        indexes = [
            models.Index(fields=['officer', 'period']),
            models.Index(fields=['total_points']),
            models.Index(fields=['period', 'total_points']),
        ]
    
    def __str__(self):
        return f"{self.officer} - {self.period} - {self.total_points} pts"
    
    def save(self, *args, **kwargs):
        """Auto-calculate total points before saving"""
        self.total_points = (
            self.qualification_points +
            self.instructor_points +
            self.special_duties_points +
            self.command_o4_points +
            self.command_o5_points
        )
        super().save(*args, **kwargs)
    
    @property
    def command_total_points(self):
        """Total command points (O-4 + O-5)"""
        return self.command_o4_points + self.command_o5_points
    
    @property
    def is_promotable_to_command(self):
        """Check if officer meets command promotion threshold"""
        return self.total_points >= self.period.command_threshold
    
    @property
    def is_promotable_to_senior(self):
        """Check if officer meets senior promotion threshold"""
        return self.total_points >= self.period.senior_threshold
    
    @property
    def recommended_promotion(self):
        """Get recommended promotion level based on points"""
        if self.is_promotable_to_command:
            return "COMMAND"
        elif self.is_promotable_to_senior:
            return "SENIOR"
        return "BASIC"


class PromotionRecommendation(models.Model):
    """
    Promotion recommendations generated from points
    """
    RECOMMENDATION_CHOICES = [
        ('COMMAND', 'Command Position'),
        ('SENIOR', 'Senior Rating'),
        ('BASIC', 'Basic Rating'),
        ('NOT_ELIGIBLE', 'Not Eligible'),
        ('PENDING_REVIEW', 'Pending Review'),
    ]
    
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='promotion_recommendations')
    period = models.ForeignKey(PromotionPeriod, on_delete=models.CASCADE,
                               related_name='promotion_recommendations')
    points_record = models.OneToOneField(PromotionPoints, on_delete=models.CASCADE,
                                         related_name='recommendation')
    
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES)
    score = models.DecimalField(max_digits=6, decimal_places=3)
    rank_eligible_for = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    
    # Approval workflow
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_promotions')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, related_name='+')
    
    class Meta:
        db_table = 'promotion_recommendations'
        verbose_name = 'Promotion Recommendation'
        verbose_name_plural = 'Promotion Recommendations'
        ordering = ['-period__evaluation_date', '-score']
    
    def __str__(self):
        return f"{self.officer} - {self.recommendation} ({self.period})"


class PromotionHistory(models.Model):
    """
    Track actual promotions granted (not just points)
    """
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE,
                                related_name='promotion_history')
    previous_rank = models.CharField(max_length=20)
    new_rank = models.CharField(max_length=20)
    promotion_date = models.DateField()
    effective_date = models.DateField()
    promotion_order_number = models.CharField(max_length=100, blank=True)
    approved_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                    null=True, blank=True, related_name='approved_promotions_history')
    remarks = models.TextField(blank=True)
    
    # Link to recommendation that led to this promotion
    recommendation = models.ForeignKey(PromotionRecommendation, on_delete=models.SET_NULL,
                                       null=True, blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL,
                                   null=True, related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'promotion_history'
        verbose_name = 'Promotion History'
        verbose_name_plural = 'Promotion Histories'
        ordering = ['-promotion_date']
    
    def __str__(self):
        return f"{self.officer} - {self.previous_rank} → {self.new_rank} ({self.promotion_date})"
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from simple_history.models import HistoricalRecords

class QualificationType(models.Model):
    """
    Lookup table for qualification types (Command, Senior, Basic, NVG CP, Instructor, etc.)
    """
    QUALIFICATION_CATEGORY_CHOICES = [
        ('COMMAND', 'Command'),
        ('SENIOR', 'Senior'),
        ('BASIC', 'Basic'),
        ('INSTRUCTOR', 'Instructor'),
        ('SPECIAL', 'Special'),
        ('RATING', 'Rating'),
    ]
    
    id = models.AutoField(primary_key=True)
    qualification_code = models.CharField(max_length=50, unique=True)
    qualification_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=QUALIFICATION_CATEGORY_CHOICES)
    promotion_points_value = models.DecimalField(max_digits=5, decimal_places=2, default=0, 
                                                  help_text="Points this qualification gives for promotion")
    requires_renewal = models.BooleanField(default=False)
    renewal_interval_months = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'qualification_types'
        verbose_name = 'Qualification Type'
        verbose_name_plural = 'Qualification Types'
        ordering = ['qualification_name']
    
    def __str__(self):
        return f"{self.qualification_name} ({self.get_category_display()})"


class Qualification(models.Model):
    """
    Qualifications earned by officers
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),
        ('EXPIRED', 'Expired'),
        ('REVOKED', 'Revoked'),
        ('PENDING', 'Pending'),
    ]
    
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='qualifications')
    qualification_type = models.ForeignKey(QualificationType, on_delete=models.PROTECT,
                                           related_name='qualifications')
    
    # Dates
    date_earned = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    date_renewed = models.DateField(null=True, blank=True)
    
    # Scoring (for promotion points)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                validators=[MinValueValidator(0), MaxValueValidator(100)])
    max_possible_score = models.DecimalField(max_digits=5, decimal_places=2, default=5.00)
    
    # Details
    issuing_authority = models.CharField(max_length=200, blank=True)
    certificate_number = models.CharField(max_length=100, blank=True)
    remarks = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'qualifications'
        verbose_name = 'Qualification'
        verbose_name_plural = 'Qualifications'
        ordering = ['-date_earned']
        indexes = [
            models.Index(fields=['officer', 'qualification_type']),
            models.Index(fields=['status']),
            models.Index(fields=['expiry_date']),
        ]
    
    def __str__(self):
        return f"{self.officer} - {self.qualification_type.qualification_name}"
    
    @property
    def is_active(self):
        if self.status != 'ACTIVE':
            return False
        if self.expiry_date:
            from django.utils import timezone
            return self.expiry_date >= timezone.now().date()
        return True
    
    @property
    def score_percentage(self):
        if self.max_possible_score and self.score:
            return (self.score / self.max_possible_score) * 100
        return None


class Rating(models.Model):
    """
    Pilot ratings (from SLL sheet - COMMAND, SENIOR, BASIC, etc.)
    """
    RATING_LEVEL_CHOICES = [
        ('COMMAND', 'Command'),
        ('SENIOR', 'Senior'),
        ('BASIC', 'Basic'),
        ('NVG_CP', 'NVG CP'),
        ('INSTRUCTOR', 'Instructor'),
        ('STANDARDIZATION', 'Standardization'),
    ]
    
    id = models.AutoField(primary_key=True)
    officer = models.OneToOneField('officers.Officer', on_delete=models.CASCADE, 
                                   related_name='rating')
    rating_level = models.CharField(max_length=20, choices=RATING_LEVEL_CHOICES)
    date_achieved = models.DateField()
    certified_by = models.ForeignKey('officers.Officer', on_delete=models.SET_NULL, 
                                     null=True, blank=True, related_name='certified_ratings')
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'ratings'
        verbose_name = 'Rating'
        verbose_name_plural = 'Ratings'
    
    def __str__(self):
        return f"{self.officer} - {self.get_rating_level_display()}"


class InstructorSpecialty(models.Model):
    """
    Instructor specialties (IP for specific aircraft types)
    From SLL sheet: IP (AW-109AH/T-129), IP (A-29B ST), etc.
    """
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='instructor_specialties')
    aircraft_type = models.ForeignKey('flight_logs.AircraftType', on_delete=models.PROTECT,
                                      null=True, blank=True)
    specialty_name = models.CharField(max_length=100)  # e.g., "IP (AW-109AH/T-129)"
    date_qualified = models.DateField()
    is_current = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'instructor_specialties'
        verbose_name = 'Instructor Specialty'
        verbose_name_plural = 'Instructor Specialties'
        unique_together = [['officer', 'aircraft_type']]
    
    def __str__(self):
        aircraft = self.aircraft_type.aircraft_code if self.aircraft_type else ""
        return f"{self.officer} - {self.specialty_name} {aircraft}"


class SpecialDuty(models.Model):
    """
    Special duties that give promotion points
    From SLL sheet: TWG, PMT, DASAT, TIAC, etc.
    """
    id = models.AutoField(primary_key=True)
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='special_duties')
    duty_name = models.CharField(max_length=100)
    duty_code = models.CharField(max_length=50, blank=True)
    points_value = models.DecimalField(max_digits=4, decimal_places=2, default=2.00)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'special_duties'
        verbose_name = 'Special Duty'
        verbose_name_plural = 'Special Duties'
    
    def __str__(self):
        return f"{self.officer} - {self.duty_name} ({self.points_value} pts)"
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from simple_history.models import HistoricalRecords

class AircraftType(models.Model):
    """
    Lookup table for aircraft types
    """
    AIRCRAFT_CATEGORY_CHOICES = [
        ('FIXED_WING', 'Fixed Wing'),
        ('ROTARY_WING', 'Rotary Wing'),
        ('UAV', 'Unmanned Aerial Vehicle'),
    ]
    
    id = models.AutoField(primary_key=True)
    aircraft_code = models.CharField(max_length=20, unique=True, help_text="e.g., AW-109, T-129, A-29B, SF-260TP")
    aircraft_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=AIRCRAFT_CATEGORY_CHOICES)
    is_active = models.BooleanField(default=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'aircraft_types'
        verbose_name = 'Aircraft Type'
        verbose_name_plural = 'Aircraft Types'
        ordering = ['aircraft_code']
    
    def __str__(self):
        return self.aircraft_code


class FlightType(models.Model):
    """
    Lookup table for flight types (Solo, Dual, Instrument, Night, Cross Country)
    """
    id = models.AutoField(primary_key=True)
    flight_type_code = models.CharField(max_length=20, unique=True)
    flight_type_name = models.CharField(max_length=50)
    is_night = models.BooleanField(default=False)
    is_instrument = models.BooleanField(default=False)
    multiplier = models.DecimalField(max_digits=3, decimal_places=2, default=1.00, 
                                      help_text="Hour multiplier for this flight type")
    
    class Meta:
        db_table = 'flight_types'
        verbose_name = 'Flight Type'
        verbose_name_plural = 'Flight Types'
    
    def __str__(self):
        return self.flight_type_name


class MissionType(models.Model):
    """
    Lookup table for mission types
    """
    MISSION_CATEGORY_CHOICES = [
        ('TRAINING', 'Training'),
        ('COMBAT', 'Combat'),
        ('TRANSPORT', 'Transport'),
        ('PATROL', 'Patrol'),
        ('RECONNAISSANCE', 'Reconnaissance'),
        ('SEARCH_RESCUE', 'Search and Rescue'),
        ('MEDEVAC', 'Medical Evacuation'),
    ]
    
    id = models.AutoField(primary_key=True)
    mission_code = models.CharField(max_length=30, unique=True)
    mission_name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=MISSION_CATEGORY_CHOICES)
    
    class Meta:
        db_table = 'mission_types'
        verbose_name = 'Mission Type'
        verbose_name_plural = 'Mission Types'
    
    def __str__(self):
        return self.mission_name


class FlightLog(models.Model):
    """
    Individual flight log entries - track each flight separately
    """
    id = models.AutoField(primary_key=True)
    
    # Relationships
    officer = models.ForeignKey('officers.Officer', on_delete=models.CASCADE, 
                                related_name='flight_logs')
    aircraft = models.ForeignKey(AircraftType, on_delete=models.PROTECT, 
                                 related_name='flight_logs', null=True, blank=True)
    flight_type = models.ForeignKey(FlightType, on_delete=models.PROTECT, 
                                    related_name='flight_logs', null=True, blank=True)
    mission_type = models.ForeignKey(MissionType, on_delete=models.PROTECT, 
                                      related_name='flight_logs', null=True, blank=True)
    certifying_officer = models.ForeignKey('officers.Officer', on_delete=models.PROTECT,
                                            null=True, blank=True, related_name='certified_flights',
                                            help_text="Instructor/Officer who certified this flight")
    
    # Flight details
    flight_date = models.DateField()
    flight_hours = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        validators=[MinValueValidator(0.01), MaxValueValidator(24.0)],
        help_text="Flight duration in hours (e.g., 2.5 for 2 hours 30 minutes)"
    )
    sortie_number = models.CharField(max_length=20, blank=True, help_text="Mission sortie number")
    takeoff_time = models.TimeField(null=True, blank=True)
    landing_time = models.TimeField(null=True, blank=True)
    
    # Additional details
    is_night_flight = models.BooleanField(default=False)
    is_instrument_flight = models.BooleanField(default=False)
    is_simulator = models.BooleanField(default=False, help_text="If this was simulator time")
    
    # Cargo/passenger info
    passenger_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    cargo_weight_kg = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    
    # Remarks
    remarks = models.TextField(blank=True)
    
    # Audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    updated_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, 
                                   related_name='+')
    
    # Historical record for audit
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'flight_logs'
        verbose_name = 'Flight Log'
        verbose_name_plural = 'Flight Logs'
        ordering = ['-flight_date']
        indexes = [
            models.Index(fields=['officer', '-flight_date']),
            models.Index(fields=['flight_date']),
            models.Index(fields=['aircraft']),
            models.Index(fields=['flight_type']),
            models.Index(fields=['mission_type']),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(flight_hours__gte=0.01),
                name='flight_hours_positive'
            )
        ]
    
    def __str__(self):
        return f"{self.officer} - {self.flight_date} - {self.flight_hours} hrs"
    
    @property
    def adjusted_hours(self):
        """Calculate hours with flight type multiplier"""
        if self.flight_type:
            return self.flight_hours * self.flight_type.multiplier
        return self.flight_hours


class FlightSummary(models.Model):
    """
    Materialized view or summary table for quick cumulative queries
    This can be refreshed periodically or updated via triggers
    """
    id = models.AutoField(primary_key=True)
    officer = models.OneToOneField('officers.Officer', on_delete=models.CASCADE, 
                                   related_name='flight_summary')
    
    # Totals
    total_flight_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_night_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_instrument_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_simulator_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Counts
    total_flights = models.IntegerField(default=0)
    total_night_flights = models.IntegerField(default=0)
    total_instrument_flights = models.IntegerField(default=0)
    
    # Last flight
    last_flight_date = models.DateField(null=True, blank=True)
    
    # Audit
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'flight_summaries'
        verbose_name = 'Flight Summary'
        verbose_name_plural = 'Flight Summaries'
    
    def __str__(self):
        return f"{self.officer} - {self.total_flight_hours} total hours"
    
    def refresh(self):
        """Recalculate totals from flight logs"""
        from django.db.models import Sum, Count, Q
        
        logs = self.officer.flight_logs.all()
        
        self.total_flight_hours = logs.aggregate(Sum('flight_hours'))['flight_hours__sum'] or 0
        self.total_night_hours = logs.filter(is_night_flight=True).aggregate(Sum('flight_hours'))['flight_hours__sum'] or 0
        self.total_instrument_hours = logs.filter(is_instrument_flight=True).aggregate(Sum('flight_hours'))['flight_hours__sum'] or 0
        self.total_simulator_hours = logs.filter(is_simulator=True).aggregate(Sum('flight_hours'))['flight_hours__sum'] or 0
        
        self.total_flights = logs.count()
        self.total_night_flights = logs.filter(is_night_flight=True).count()
        self.total_instrument_flights = logs.filter(is_instrument_flight=True).count()
        
        self.last_flight_date = logs.order_by('-flight_date').values_list('flight_date', flat=True).first()
        
        self.save()
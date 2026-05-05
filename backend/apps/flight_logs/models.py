from django.db import models
from simple_history.models import HistoricalRecords
from apps.officers.models import Officer


class FlightLog(models.Model):
    AIRCRAFT_CHOICES = [
        ('T-129', 'T-129 ATAK'),
        ('AW-109', 'AW-109AH'),
        ('MD-520', 'MD-520MG'),
        ('SF-260', 'SF-260TP'),
        ('OV-10', 'OV-10 Bronco'),
    ]
    
    MISSION_CHOICES = [
        ('TRAINING', 'Training'),
        ('COMBAT', 'Combat'),
        ('RECON', 'Reconnaissance'),
        ('TRANSPORT', 'Transport'),
        ('TEST', 'Test Flight'),
        ('MAINTENANCE', 'Maintenance Flight'),
        ('OTHER', 'Other'),
    ]
    
    officer = models.ForeignKey(Officer, on_delete=models.CASCADE, related_name='flight_logs')
    flight_date = models.DateField()
    flight_hours = models.DecimalField(max_digits=6, decimal_places=1)
    aircraft_type = models.CharField(max_length=20, choices=AIRCRAFT_CHOICES, default='T-129')  # Added default
    mission_type = models.CharField(max_length=20, choices=MISSION_CHOICES, default='TRAINING')
    remarks = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    history = HistoricalRecords()
    
    class Meta:
        db_table = 'flight_logs'
        ordering = ['-flight_date']
    
    def __str__(self):
        return f"{self.officer} - {self.flight_date} - {self.flight_hours} hrs"
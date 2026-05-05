from django.contrib import admin
from django import forms
from .models import FlightLog


class FlightLogAdminForm(forms.ModelForm):
    class Meta:
        model = FlightLog
        fields = '__all__'
        widgets = {
            'flight_date': forms.DateInput(attrs={'type': 'date'}),
        }


@admin.register(FlightLog)
class FlightLogAdmin(admin.ModelAdmin):
    form = FlightLogAdminForm
    list_display = ['officer', 'flight_date', 'flight_hours', 'aircraft_type', 'mission_type']
    list_filter = ['aircraft_type', 'mission_type']
    search_fields = ['officer__first_name', 'officer__last_name', 'remarks']
    raw_id_fields = ['officer']
    date_hierarchy = 'flight_date'
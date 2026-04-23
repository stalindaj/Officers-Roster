from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import AircraftType, FlightType, MissionType, FlightLog, FlightSummary

@admin.register(AircraftType)
class AircraftTypeAdmin(SimpleHistoryAdmin):
    list_display = ('aircraft_code', 'aircraft_name', 'category', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('aircraft_code', 'aircraft_name')

@admin.register(FlightType)
class FlightTypeAdmin(SimpleHistoryAdmin):
    list_display = ('flight_type_code', 'flight_type_name', 'is_night', 'is_instrument', 'multiplier')
    list_filter = ('is_night', 'is_instrument')

@admin.register(MissionType)
class MissionTypeAdmin(SimpleHistoryAdmin):
    list_display = ('mission_code', 'mission_name', 'category')
    list_filter = ('category',)

@admin.register(FlightLog)
class FlightLogAdmin(SimpleHistoryAdmin):
    list_display = ('officer', 'flight_date', 'flight_hours', 'aircraft', 'flight_type', 'mission_type')
    list_filter = ('flight_date', 'aircraft', 'flight_type', 'mission_type', 'is_night_flight')
    search_fields = ('officer__first_name', 'officer__last_name', 'remarks')
    date_hierarchy = 'flight_date'
    raw_id_fields = ('officer', 'certifying_officer')

@admin.register(FlightSummary)
class FlightSummaryAdmin(admin.ModelAdmin):
    list_display = ('officer', 'total_flight_hours', 'total_flights', 'last_flight_date')
    search_fields = ('officer__first_name', 'officer__last_name')
    readonly_fields = ('total_flight_hours', 'total_night_hours', 'total_instrument_hours', 
                       'total_simulator_hours', 'total_flights', 'last_flight_date')
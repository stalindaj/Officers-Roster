from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import QualificationType, Qualification, Rating, InstructorSpecialty, SpecialDuty

@admin.register(QualificationType)
class QualificationTypeAdmin(SimpleHistoryAdmin):
    list_display = ('qualification_code', 'qualification_name', 'category', 'promotion_points_value', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('qualification_code', 'qualification_name')

@admin.register(Qualification)
class QualificationAdmin(SimpleHistoryAdmin):
    list_display = ('officer', 'qualification_type', 'date_earned', 'expiry_date', 'score', 'status')
    list_filter = ('qualification_type', 'status')
    search_fields = ('officer__first_name', 'officer__last_name', 'certificate_number')
    date_hierarchy = 'date_earned'
    raw_id_fields = ('officer',)

@admin.register(Rating)
class RatingAdmin(SimpleHistoryAdmin):
    list_display = ('officer', 'rating_level', 'date_achieved')
    list_filter = ('rating_level',)
    search_fields = ('officer__first_name', 'officer__last_name')
    raw_id_fields = ('officer', 'certified_by')

@admin.register(InstructorSpecialty)
class InstructorSpecialtyAdmin(admin.ModelAdmin):
    list_display = ('officer', 'specialty_name', 'aircraft_type', 'date_qualified', 'is_current')
    list_filter = ('is_current', 'aircraft_type')
    search_fields = ('officer__first_name', 'officer__last_name', 'specialty_name')
    raw_id_fields = ('officer',)

@admin.register(SpecialDuty)
class SpecialDutyAdmin(admin.ModelAdmin):
    list_display = ('officer', 'duty_name', 'points_value', 'start_date', 'end_date', 'is_current')
    list_filter = ('is_current',)
    search_fields = ('officer__first_name', 'officer__last_name', 'duty_name')
    raw_id_fields = ('officer',)
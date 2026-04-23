from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import SuccessionPlan, TransitionLog

@admin.register(SuccessionPlan)
class SuccessionPlanAdmin(SimpleHistoryAdmin):
    list_display = ('unit', 'position', 'current_officer', 'proposed_officer', 'priority', 'status', 'target_date')
    list_filter = ('status', 'priority', 'unit')
    search_fields = ('unit__unit_code', 'position__position_title', 
                     'current_officer__first_name', 'current_officer__last_name',
                     'proposed_officer__first_name', 'proposed_officer__last_name')
    date_hierarchy = 'target_date'
    raw_id_fields = ('current_officer', 'proposed_officer', 'position', 'unit')
    
    fieldsets = (
        ('Position Info', {'fields': ('unit', 'position')}),
        ('Officers', {'fields': ('current_officer', 'proposed_officer')}),
        ('Planning', {'fields': ('priority', 'target_date', 'expected_relinquish_date', 'status')}),
        ('Approval', {'fields': ('proposed_by', 'proposed_date', 'approved_by', 'approved_date')}),
        ('Additional', {'fields': ('remarks',)}),
    )

@admin.register(TransitionLog)
class TransitionLogAdmin(admin.ModelAdmin):
    list_display = ('officer', 'transition_type', 'effective_date', 'from_unit', 'to_unit')
    list_filter = ('transition_type', 'effective_date')
    search_fields = ('officer__first_name', 'officer__last_name', 'order_number')
    date_hierarchy = 'effective_date'
    raw_id_fields = ('officer', 'from_unit', 'to_unit', 'from_position', 'to_position')
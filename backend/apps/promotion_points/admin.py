from django.contrib import admin
from simple_history.admin import SimpleHistoryAdmin
from .models import PromotionPeriod, PromotionPoints, PromotionRecommendation, PromotionHistory

@admin.register(PromotionPeriod)
class PromotionPeriodAdmin(SimpleHistoryAdmin):
    list_display = ('period_name', 'period_code', 'start_date', 'end_date', 'status')
    list_filter = ('status',)
    search_fields = ('period_name', 'period_code')
    date_hierarchy = 'evaluation_date'

@admin.register(PromotionPoints)
class PromotionPointsAdmin(SimpleHistoryAdmin):
    list_display = ('officer', 'period', 'qualification_points', 'instructor_points', 
                    'special_duties_points', 'command_total_points', 'total_points')
    list_filter = ('period',)
    search_fields = ('officer__first_name', 'officer__last_name')
    raw_id_fields = ('officer', 'evaluated_by')
    readonly_fields = ('total_points',)
    
    fieldsets = (
        ('Basic Info', {'fields': ('officer', 'period')}),
        ('Qualification (5 pts max)', {'fields': ('qualification_points', 'qualification_remarks')}),
        ('Instructor Duties (3 pts max)', {'fields': ('instructor_points', 'instructor_remarks')}),
        ('Special Duties (2 pts max)', {'fields': ('special_duties_points', 'special_duties_remarks')}),
        ('Command Duties', {'fields': ('command_o4_points', 'command_o5_points', 'command_remarks')}),
        ('Flight Info', {'fields': ('flying_hours', 'flying_rating')}),
        ('Evaluation', {'fields': ('evaluated_by', 'evaluation_notes', 'remarks')}),
    )

@admin.register(PromotionRecommendation)
class PromotionRecommendationAdmin(admin.ModelAdmin):
    list_display = ('officer', 'period', 'recommendation', 'score', 'is_approved')
    list_filter = ('recommendation', 'is_approved', 'period')
    search_fields = ('officer__first_name', 'officer__last_name')
    raw_id_fields = ('officer', 'points_record', 'approved_by')
    readonly_fields = ('score',)

@admin.register(PromotionHistory)
class PromotionHistoryAdmin(SimpleHistoryAdmin):
    list_display = ('officer', 'previous_rank', 'new_rank', 'promotion_date', 'effective_date')
    list_filter = ('previous_rank', 'new_rank')
    search_fields = ('officer__first_name', 'officer__last_name', 'promotion_order_number')
    date_hierarchy = 'promotion_date'
    raw_id_fields = ('officer', 'recommendation', 'approved_by')
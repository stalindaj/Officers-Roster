from django.contrib import admin
from .models import Qualification


@admin.register(Qualification)
class QualificationAdmin(admin.ModelAdmin):
    list_display = ['officer', 'qualification_type', 'name', 'date_earned', 'status']
    list_filter = ['qualification_type', 'status']
    search_fields = ['officer__first_name', 'officer__last_name', 'name', 'certificate_number']
    raw_id_fields = ['officer']
    fieldsets = (
        ('Officer', {
            'fields': ('officer',)
        }),
        ('Qualification Details', {
            'fields': ('qualification_type', 'name', 'date_earned', 'expiration_date', 'status')
        }),
        ('Additional Info', {
            'fields': ('issuing_authority', 'certificate_number', 'description'),
            'classes': ('collapse',)
        }),
    )
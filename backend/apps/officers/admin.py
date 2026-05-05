# backend/apps/officers/admin.py
from django.contrib import admin
from django import forms
from .models import Officer
from apps.assignments.models import Assignment


class OfficerAdminForm(forms.ModelForm):
    class Meta:
        model = Officer
        fields = '__all__'
        widgets = {
            'paf_number': forms.TextInput(attrs={'placeholder': 'O-12345', 'style': 'width: 200px;'}),
            'first_name': forms.TextInput(attrs={'style': 'width: 200px;'}),
            'last_name': forms.TextInput(attrs={'style': 'width: 200px;'}),
            'rank': forms.Select(attrs={'style': 'width: 150px;'}),
            'status': forms.Select(attrs={'style': 'width: 150px;'}),
            'date_commissioned': forms.DateInput(attrs={'type': 'date'}),
        }


class AssignmentInline(admin.TabularInline):
    model = Assignment
    extra = 1
    fields = ['unit', 'position', 'date_assumed', 'date_relinquished', 'assignment_type']
    raw_id_fields = ['unit', 'position']


@admin.register(Officer)
class OfficerAdmin(admin.ModelAdmin):
    form = OfficerAdminForm
    inlines = [AssignmentInline]

    list_display = [
        'paf_number',
        'rank',
        'first_name',
        'last_name',
        'status'
    ]

    list_filter = [
        'rank',
        'status'
    ]

    search_fields = [
        'paf_number',
        'first_name',
        'last_name'
    ]

    fieldsets = (
        ('Basic Information', {
            'fields': ('paf_number', 'rank', 'first_name', 'last_name', 'middle_name', 'suffix')
        }),
        ('Status & Dates', {
            'fields': ('status', 'date_commissioned', 'date_birth')
        }),
        ('Audit', {
            'fields': ('created_by', 'updated_by'),
            'classes': ('collapse',)
        }),
    )
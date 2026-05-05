from django.contrib import admin
from django import forms
from .models import Assignment


class AssignmentAdminForm(forms.ModelForm):
    class Meta:
        model = Assignment
        fields = '__all__'
        widgets = {
            'date_assumed': forms.DateInput(attrs={'type': 'date'}),
            'date_relinquished': forms.DateInput(attrs={'type': 'date'}),
        }


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    form = AssignmentAdminForm
    list_display = ['officer', 'unit', 'position', 'date_assumed', 'date_relinquished', 'assignment_type']
    list_filter = ['assignment_type', 'unit']
    search_fields = ['officer__first_name', 'officer__last_name', 'unit__unit_code']
    raw_id_fields = ['officer', 'unit', 'position']
    autocomplete_fields = ['officer', 'unit', 'position']
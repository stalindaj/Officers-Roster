from django.contrib import admin
from .models import Unit


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['unit_code', 'unit_name', 'parent_unit']
    search_fields = ['unit_code', 'unit_name']
    list_filter = ['parent_unit']
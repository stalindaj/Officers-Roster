from django.contrib import admin
from .models import Position


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['position_code', 'position_title', 'position_category']
    search_fields = ['position_code', 'position_title']
    list_filter = ['position_category']
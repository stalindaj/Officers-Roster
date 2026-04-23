from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from simple_history.admin import SimpleHistoryAdmin

@admin.register(User)
class CustomUserAdmin(SimpleHistoryAdmin, UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser')
    search_fields = ('username', 'first_name', 'last_name', 'email')
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'middle_name', 'contact_number')}),
    )
    
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Additional Info', {'fields': ('role', 'middle_name', 'contact_number', 'email')}),
    )
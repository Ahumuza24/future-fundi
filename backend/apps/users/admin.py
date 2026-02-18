from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'role', 'tenant', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'is_staff', 'tenant']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('tenant', 'teacher_schools', 'role')}),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('tenant', 'teacher_schools', 'role')}),
    )

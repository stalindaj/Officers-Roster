#!/usr/bin/env python
"""
Excel Import Script for 15SW Officer Tracking System
Run: python manage.py runscript import_excel --script-args <excel_file_path>
Or: python scripts/import_excel.py <excel_file_path>
"""

import os
import sys
import re
from datetime import datetime
import pandas as pd
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

import django
django.setup()

from apps.officers.models import Officer
from apps.units.models import Unit
from apps.positions.models import Position
from apps.assignments.models import Assignment
from apps.flight_logs.models import FlightLog, AircraftType, FlightType, MissionType
from apps.qualifications.models import Qualification, QualificationType, Rating
from apps.promotion_points.models import PromotionPoints, PromotionPeriod

User = get_user_model()


class ExcelImporter:
    """Main class to import Excel data into the database"""
    
    def __init__(self, excel_path):
        self.excel_path = excel_path
        self.excel_file = pd.ExcelFile(excel_path)
        
        # Cache dictionaries for lookup
        self.officers_cache = {}
        self.units_cache = {}
        self.positions_cache = {}
        self.aircraft_cache = {}
        
        # Statistics
        self.stats = {
            'officers_created': 0,
            'officers_updated': 0,
            'assignments_created': 0,
            'units_created': 0,
            'positions_created': 0,
        }
        
        # Get or create system user for audit
        self.system_user, _ = User.objects.get_or_create(
            username='system_import',
            defaults={
                'email': 'system@example.com',
                'role': 'superadmin',
                'is_active': True
            }
        )
    
    def extract_officer_id(self, name_string):
        """Extract PAF officer ID from name string"""
        if not name_string:
            return None
        match = re.search(r'O-\d+', str(name_string))
        return match.group(0) if match else None
    
    def extract_rank(self, name_string):
        """Extract rank from name string"""
        if not name_string:
            return None
        ranks = ['LTC', 'MAJ', 'CPT', '1LT', '2LT', 'CDR', 'LTCDR', 'LT', 'LTJG', 'ENS']
        for rank in ranks:
            if rank in str(name_string).upper():
                return rank
        return None
    
    def extract_name_parts(self, name_string):
        """Extract first and last name from full name string"""
        if not name_string:
            return None, None
        name_str = str(name_string)
        # Remove rank and PAF number
        name_str = re.sub(r'LTC|MAJ|CPT|1LT|2LT|CDR', '', name_str)
        name_str = re.sub(r'O-\d+', '', name_str)
        name_str = re.sub(r'PAF', '', name_str)
        name_str = name_str.strip()
        
        parts = name_str.split()
        if len(parts) >= 2:
            return parts[0], ' '.join(parts[1:])
        elif len(parts) == 1:
            return parts[0], ''
        return None, None
    
    def get_or_create_officer(self, name_string):
        """Get or create officer from name string"""
        if not name_string or pd.isna(name_string):
            return None
        
        name_str = str(name_string).strip()
        if name_str in self.officers_cache:
            return self.officers_cache[name_str]
        
        officer_id = self.extract_officer_id(name_str)
        rank = self.extract_rank(name_str)
        first_name, last_name = self.extract_name_parts(name_str)
        
        if not officer_id:
            # Try to find by name
            officer = Officer.objects.filter(
                first_name=first_name,
                last_name=last_name
            ).first()
            if officer:
                self.officers_cache[name_str] = officer
                return officer
            return None
        
        officer, created = Officer.objects.update_or_create(
            paf_number=officer_id,
            defaults={
                'rank': rank or 'CPT',
                'first_name': first_name or '',
                'last_name': last_name or '',
                'status': 'ACTIVE'
            }
        )
        
        if created:
            self.stats['officers_created'] += 1
            print(f"  Created officer: {officer.full_name} ({officer.paf_number})")
        
        self.officers_cache[name_str] = officer
        return officer
    
    def get_or_create_unit(self, unit_code):
        """Get or create unit"""
        if not unit_code or pd.isna(unit_code):
            return None
        
        unit_code = str(unit_code).strip().upper()
        if unit_code in self.units_cache:
            return self.units_cache[unit_code]
        
        unit, created = Unit.objects.get_or_create(
            unit_code=unit_code,
            defaults={'unit_name': unit_code, 'is_active': True}
        )
        
        if created:
            self.stats['units_created'] += 1
            print(f"  Created unit: {unit_code}")
        
        self.units_cache[unit_code] = unit
        return unit
    
    def get_or_create_position(self, position_title):
        """Get or create position"""
        if not position_title or pd.isna(position_title):
            return None
        
        position_title = str(position_title).strip()
        if position_title in self.positions_cache:
            return self.positions_cache[position_title]
        
        position, created = Position.objects.get_or_create(
            position_title=position_title,
            defaults={
                'position_code': position_title[:50].upper().replace(' ', '_'),
                'position_category': self._categorize_position(position_title)
            }
        )
        
        if created:
            self.stats['positions_created'] += 1
        
        self.positions_cache[position_title] = position
        return position
    
    def _categorize_position(self, title):
        """Categorize position based on title"""
        title_upper = title.upper()
        if 'COMMANDER' in title_upper:
            return 'COMMAND'
        elif 'INSTRUCTOR' in title_upper:
            return 'INSTRUCTOR'
        elif 'OPERATIONS' in title_upper:
            return 'OPERATIONS'
        elif 'STAFF' in title_upper:
            return 'STAFF'
        return 'SUPPORT'
    
    def parse_date(self, date_value):
        """Parse date from Excel"""
        if pd.isna(date_value):
            return None
        if isinstance(date_value, datetime):
            return date_value.date()
        if isinstance(date_value, str):
            try:
                return datetime.strptime(date_value, '%Y-%m-%d').date()
            except:
                return None
        return None
    
    @transaction.atomic
    def import_unit_sheet(self, sheet_name, unit_code):
        """Import a unit assignment sheet (16AS, 17AS, 460AMG, etc.)"""
        print(f"\n📋 Importing sheet: {sheet_name} (Unit: {unit_code})")
        
        df = pd.read_excel(self.excel_path, sheet_name=sheet_name)
        df.columns = [str(col).strip() for col in df.columns]
        
        unit = self.get_or_create_unit(unit_code)
        if not unit:
            print(f"  ⚠️ Could not create unit for {unit_code}")
            return
        
        assignments_created = 0
        
        for idx, row in df.iterrows():
            # Find name column (usually first column)
            name_col = df.columns[0]
            name_value = row[name_col] if name_col in row else None
            
            # Skip header rows
            if not name_value or str(name_value).upper() in ['NAME', 'NAN', 'NONE']:
                continue
            
            officer = self.get_or_create_officer(name_value)
            if not officer:
                continue
            
            # Find position (usually second column)
            position_col = df.columns[1] if len(df.columns) > 1 else None
            position_title = row[position_col] if position_col and position_col in row else None
            
            position = self.get_or_create_position(position_title) if position_title else None
            
            # Find date columns
            date_assumed = None
            date_relinquished = None
            
            for col in df.columns:
                col_lower = str(col).lower()
                if 'assumed' in col_lower:
                    date_assumed = self.parse_date(row[col])
                elif 'relinquished' in col_lower or 'relinquish' in col_lower:
                    date_relinquished = self.parse_date(row[col])
            
            if not date_assumed:
                continue
            
            # Create assignment
            assignment, created = Assignment.objects.get_or_create(
                officer=officer,
                unit=unit,
                position=position,
                date_assumed=date_assumed,
                defaults={
                    'date_relinquished': date_relinquished,
                    'assignment_type': 'PERMANENT',
                    'created_by': self.system_user
                }
            )
            
            if created:
                assignments_created += 1
        
        self.stats['assignments_created'] += assignments_created
        print(f"  ✅ Created {assignments_created} assignments for {unit_code}")
    
    @transaction.atomic
    def import_all(self):
        """Import all sheets"""
        print("\n" + "="*60)
        print("🚀 STARTING EXCEL IMPORT")
        print("="*60)
        
        # Map sheet names to unit codes
        unit_sheets = {
            'HAS': 'HAS',
            '16AS': '16AS',
            '17AS': '17AS',
            '18AS': '18AS',
            '19CTTS': '19CTTS',
            '20AS': '20AS',
            '460AMG': '460AMG',
            '461FWFMS': '461FWFMS',
            '462RWFMS': '462RWFMS',
            '463AAMS': '463AAMS',
            '464SSS': '464SSS',
        }
        
        # Import each unit sheet
        for sheet_name, unit_code in unit_sheets.items():
            if sheet_name in self.excel_file.sheet_names:
                self.import_unit_sheet(sheet_name, unit_code)
        
        # Print summary
        print("\n" + "="*60)
        print("📊 IMPORT SUMMARY")
        print("="*60)
        print(f"  Officers created: {self.stats['officers_created']}")
        print(f"  Units created: {self.stats['units_created']}")
        print(f"  Positions created: {self.stats['positions_created']}")
        print(f"  Assignments created: {self.stats['assignments_created']}")
        print("="*60)
        print("✅ IMPORT COMPLETE!")


def run_import():
    """Run the import"""
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_excel.py <excel_file_path>")
        print("Example: python scripts/import_excel.py 'Copy of 15SW Officer and Pilot Career Development Program.xlsx'")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    
    if not os.path.exists(excel_path):
        print(f"❌ File not found: {excel_path}")
        sys.exit(1)
    
    importer = ExcelImporter(excel_path)
    importer.import_all()


if __name__ == "__main__":
    run_import()
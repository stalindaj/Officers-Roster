#!/usr/bin/env python
import os
import sys
import re
from datetime import datetime
import pandas as pd
import django

sys.path.append("/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from apps.officers.models import Officer
from apps.units.models import Unit
from apps.positions.models import Position
from apps.assignments.models import Assignment
from django.contrib.auth import get_user_model

User = get_user_model()

class ExcelImporter:
    def __init__(self, excel_path):
        self.excel_path = excel_path
        self.excel_file = pd.ExcelFile(excel_path)
        self.stats = {"officers": 0, "units": 0, "positions": 0, "assignments": 0}
        self.position_cache = {}
        
        self.system_user, _ = User.objects.get_or_create(
            username="system",
            defaults={"is_active": True}
        )
    
    def extract_officer_id(self, name_string):
        if not name_string or pd.isna(name_string):
            return None
        match = re.search(r"O-\d+", str(name_string))
        return match.group(0) if match else None
    
    def extract_rank(self, name_string):
        if not name_string or pd.isna(name_string):
            return "CPT"
        ranks = ["LTC", "MAJ", "CPT", "1LT", "2LT"]
        for rank in ranks:
            if rank in str(name_string).upper():
                return rank
        return "CPT"
    
    def extract_name_parts(self, name_string):
        if not name_string or pd.isna(name_string):
            return "Unknown", "Officer"
        name_str = str(name_string)
        name_clean = re.sub(r"LTC|MAJ|CPT|1LT|2LT|O-\d+|PAF|\(GSC\)", "", name_str).strip()
        parts = name_clean.split()
        if len(parts) >= 2:
            return parts[0], " ".join(parts[1:])
        elif len(parts) == 1:
            return parts[0], "Officer"
        return "Unknown", "Officer"
    
    def get_or_create_officer(self, name_string):
        if not name_string or pd.isna(name_string):
            return None
        
        name_str = str(name_string).strip()
        officer_id = self.extract_officer_id(name_str)
        
        if not officer_id:
            return None
        
        rank = self.extract_rank(name_str)
        first_name, last_name = self.extract_name_parts(name_str)
        
        officer, created = Officer.objects.get_or_create(
            paf_number=officer_id,
            defaults={
                'rank': rank,
                'first_name': first_name,
                'last_name': last_name,
                'status': 'ACTIVE'
            }
        )
        if created:
            self.stats['officers'] += 1
            print(f"  Created officer: {officer.paf_number} - {first_name} {last_name}")
        return officer
    
    def get_or_create_unit(self, unit_code):
        if not unit_code or pd.isna(unit_code):
            return None
        unit, created = Unit.objects.get_or_create(
            unit_code=str(unit_code).strip().upper(),
            defaults={'unit_name': str(unit_code).strip(), 'is_active': True}
        )
        if created:
            self.stats['units'] += 1
            print(f"  Created unit: {unit.unit_code}")
        return unit
    
    def get_or_create_position(self, position_title):
        if not position_title or pd.isna(position_title):
            return None
        
        position_title = str(position_title).strip()
        
        # Check cache first
        if position_title in self.position_cache:
            return self.position_cache[position_title]
        
        # Create a safe position code
        position_code = re.sub(r'[^A-Za-z0-9]', '_', position_title)[:50].upper()
        
        # Make sure code is unique
        original_code = position_code
        counter = 1
        while Position.objects.filter(position_code=position_code).exists():
            position_code = f"{original_code}_{counter}"
            counter += 1
        
        position, created = Position.objects.get_or_create(
            position_title=position_title,
            defaults={
                'position_code': position_code,
                'position_category': 'SUPPORT'
            }
        )
        
        if created:
            self.stats['positions'] += 1
        
        self.position_cache[position_title] = position
        return position
    
    def parse_date(self, date_value):
        if pd.isna(date_value):
            return None
        if isinstance(date_value, datetime):
            return date_value.date()
        if isinstance(date_value, str):
            try:
                return datetime.strptime(date_value, '%Y-%m-%d').date()
            except:
                try:
                    return datetime.strptime(date_value, '%m/%d/%Y').date()
                except:
                    return None
        return None
    
    def import_unit_sheet(self, sheet_name, unit_code):
        print(f"\n📋 Importing sheet: {sheet_name} (Unit: {unit_code})")
        
        df = pd.read_excel(self.excel_path, sheet_name=sheet_name)
        df.columns = [str(col).strip() for col in df.columns]
        
        unit = self.get_or_create_unit(unit_code)
        if not unit:
            print(f"  ⚠️ Could not create unit for {unit_code}")
            return
        
        assignments_created = 0
        
        for idx, row in df.iterrows():
            name_col = df.columns[0]
            name_value = row[name_col] if name_col in row else None
            
            if not name_value or pd.isna(name_value):
                continue
            
            name_str = str(name_value).strip()
            if name_str.upper() in ['NAME', 'NAN', 'NONE', '']:
                continue
            
            officer = self.get_or_create_officer(name_value)
            if not officer:
                continue
            
            position_col = df.columns[1] if len(df.columns) > 1 else None
            position_title = row[position_col] if position_col and position_col in row else None
            position = self.get_or_create_position(position_title) if position_title and not pd.isna(position_title) else None
            
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
            
            # Check if assignment already exists
            existing_assignment = Assignment.objects.filter(
                officer=officer,
                unit=unit,
                position=position,
                date_assumed=date_assumed
            ).first()
            
            if existing_assignment:
                continue
            
            assignment = Assignment.objects.create(
                officer=officer,
                unit=unit,
                position=position,
                date_assumed=date_assumed,
                date_relinquished=date_relinquished,
                assignment_type='PERMANENT',
                created_by=self.system_user
            )
            assignments_created += 1
        
        self.stats['assignments'] += assignments_created
        print(f"  ✅ Created {assignments_created} assignments for {unit_code}")
    
    def import_all(self):
        print("\n" + "="*60)
        print("🚀 STARTING EXCEL IMPORT")
        print("="*60)
        
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
        
        for sheet_name, unit_code in unit_sheets.items():
            if sheet_name in self.excel_file.sheet_names:
                self.import_unit_sheet(sheet_name, unit_code)
        
        print("\n" + "="*60)
        print("📊 IMPORT SUMMARY")
        print("="*60)
        print(f"  Officers created: {self.stats['officers']}")
        print(f"  Units created: {self.stats['units']}")
        print(f"  Positions created: {self.stats['positions']}")
        print(f"  Assignments created: {self.stats['assignments']}")
        print("="*60)
        print("✅ IMPORT COMPLETE!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python import_excel.py <excel_file_path>")
        sys.exit(1)
    
    excel_path = sys.argv[1]
    if not os.path.exists(excel_path):
        print(f"❌ File not found: {excel_path}")
        sys.exit(1)
    
    importer = ExcelImporter(excel_path)
    importer.import_all()
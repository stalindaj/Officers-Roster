#!/usr/bin/env python
"""
Fast import script for Neon database - Imports officers and assignments
Run: docker compose --env-file .env.dev run --rm backend python fast_import.py
"""

import json
import sys
import os

# Setup Django BEFORE importing any models
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django
import django
django.setup()

# Now import models
from django.db import connection, transaction
from apps.users.models import User
from apps.units.models import Unit
from apps.positions.models import Position
from apps.officers.models import Officer
from apps.assignments.models import Assignment

def fast_import():
    print("\n" + "="*60)
    print("🚀 FAST IMPORT TO NEON DATABASE")
    print("="*60)
    
    # Load the JSON data
    json_file = '/app/import_data.json'
    if not os.path.exists(json_file):
        print(f"❌ File not found: {json_file}")
        print("Make sure import_data.json is in the container")
        return
    
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    print(f"\n📦 Loaded {len(data)} total objects")
    
    # Group by model
    models_data = {}
    for obj in data:
        model = obj['model']
        if model not in models_data:
            models_data[model] = []
        models_data[model].append(obj)
    
    print("\n📊 Objects to import:")
    for model, objects in sorted(models_data.items()):
        print(f"  {model}: {len(objects)} objects")
    
    # Import data
    print("\n📥 Importing data...")
    print("-" * 40)
    
    imported = {}
    
    try:
        with transaction.atomic():
            # 1. Import Users
            if 'users.user' in models_data:
                print("  ✓ Importing users...")
                count = 0
                for obj in models_data['users.user']:
                    try:
                        User.objects.create(
                            id=obj['pk'],
                            username=obj['fields']['username'],
                            password=obj['fields']['password'],
                            first_name=obj['fields'].get('first_name', ''),
                            last_name=obj['fields'].get('last_name', ''),
                            email=obj['fields'].get('email', ''),
                            is_active=obj['fields'].get('is_active', True),
                            is_staff=obj['fields'].get('is_staff', False),
                            is_superuser=obj['fields'].get('is_superuser', False),
                        )
                        count += 1
                    except Exception as e:
                        pass  # Skip duplicates
                imported['users'] = count
                print(f"    → Imported {imported['users']} users")
            
            # 2. Import Units
            if 'units.unit' in models_data:
                print("  ✓ Importing units...")
                count = 0
                for obj in models_data['units.unit']:
                    try:
                        Unit.objects.create(
                            id=obj['pk'],
                            unit_code=obj['fields']['unit_code'],
                            unit_name=obj['fields'].get('unit_name', ''),
                            parent_unit_id=obj['fields'].get('parent_unit'),
                            location=obj['fields'].get('location', ''),
                        )
                        count += 1
                    except Exception as e:
                        pass
                imported['units'] = count
                print(f"    → Imported {imported['units']} units")
            
            # 3. Import Positions
            if 'positions.position' in models_data:
                print("  ✓ Importing positions...")
                count = 0
                for obj in models_data['positions.position']:
                    try:
                        Position.objects.create(
                            id=obj['pk'],
                            position_code=obj['fields']['position_code'],
                            position_title=obj['fields'].get('position_title', ''),
                            position_category=obj['fields'].get('position_category', ''),
                        )
                        count += 1
                    except Exception as e:
                        pass
                imported['positions'] = count
                print(f"    → Imported {imported['positions']} positions")
            
            # 4. Import Officers (Pilots)
            if 'officers.officer' in models_data:
                print("  ✓ Importing officers (pilots)...")
                count = 0
                for obj in models_data['officers.officer']:
                    try:
                        Officer.objects.create(
                            id=obj['pk'],
                            paf_number=obj['fields']['paf_number'],
                            rank=obj['fields'].get('rank', ''),
                            first_name=obj['fields'].get('first_name', ''),
                            last_name=obj['fields'].get('last_name', ''),
                            status=obj['fields'].get('status', 'ACTIVE'),
                        )
                        count += 1
                    except Exception as e:
                        print(f"      Error: {e}")
                        pass
                imported['officers'] = count
                print(f"    → Imported {imported['officers']} officers (pilots)")
            
            # 5. Import Assignments (History)
            if 'assignments.assignment' in models_data:
                print("  ✓ Importing assignments (history)...")
                count = 0
                for obj in models_data['assignments.assignment']:
                    try:
                        Assignment.objects.create(
                            id=obj['pk'],
                            officer_id=obj['fields']['officer'],
                            unit_id=obj['fields']['unit'],
                            position_id=obj['fields'].get('position'),
                            date_assumed=obj['fields'].get('date_assumed'),
                            date_relinquished=obj['fields'].get('date_relinquished'),
                            assignment_type=obj['fields'].get('assignment_type', 'PERMANENT'),
                        )
                        count += 1
                    except Exception as e:
                        pass
                imported['assignments'] = count
                print(f"    → Imported {imported['assignments']} assignments")
            
            # 6. Import Flight Logs if they exist
            if 'flight_logs.flightlog' in models_data:
                print("  ✓ Importing flight logs...")
                from apps.flight_logs.models import FlightLog
                count = 0
                for obj in models_data['flight_logs.flightlog']:
                    try:
                        FlightLog.objects.create(
                            id=obj['pk'],
                            officer_id=obj['fields']['officer'],
                            flight_date=obj['fields'].get('flight_date'),
                            flight_hours=obj['fields'].get('flight_hours', 0),
                            mission_type=obj['fields'].get('mission_type', ''),
                        )
                        count += 1
                    except Exception as e:
                        pass
                imported['flight_logs'] = count
                print(f"    → Imported {imported['flight_logs']} flight logs")
        
    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        return
    
    # Summary
    print("\n" + "="*60)
    print("✅ IMPORT COMPLETE!")
    print("="*60)
    print("📊 FINAL COUNTS IN NEON:")
    
    final_officers = Officer.objects.count()
    final_assignments = Assignment.objects.count()
    final_units = Unit.objects.count()
    
    print(f"  Officers (Pilots): {final_officers}")
    print(f"  Assignments (History): {final_assignments}")
    print(f"  Units: {final_units}")
    
    if final_officers > 0:
        pilot = Officer.objects.first()
        print(f"\n🎯 Sample pilot: {pilot.rank} {pilot.first_name} {pilot.last_name}")
        print(f"   PAF: {pilot.paf_number}")
    
    print("="*60)
    print("\n🎉 Your pilots and their history are now in Neon!")

if __name__ == "__main__":
    fast_import()
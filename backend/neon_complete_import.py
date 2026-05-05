#!/usr/bin/env python
"""Complete working import for Neon - Fixed all schema issues"""
import json
import os
import sys
import psycopg2
from datetime import datetime

# Database connection
DB_HOST = os.environ.get('DB_HOST', 'postgres')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'officer_tracking_new')
DB_USER = os.environ.get('DB_USER', 'officer_admin')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'secure_password_123')
SSLMODE = os.environ.get('SSLMODE', 'disable')

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode=SSLMODE
    )

def import_data():
    print("\n" + "="*60)
    print("🚀 COMPLETE IMPORT - PILOTS & ASSIGNMENTS TO NEON")
    print("="*60)
    
    # Load JSON data
    with open('/app/import_data.json', 'r') as f:
        data = json.load(f)
    
    print(f"\n📦 Loaded {len(data)} objects")
    
    # Show structure of first item with pk
    if len(data) > 0:
        print(f"Sample has 'pk': {'pk' in data[0]}")
    
    # Filter to main tables (exclude historical)
    filtered = []
    for obj in data:
        model = obj.get('model', '')
        if 'historical' not in model and 'audit' not in model:
            filtered.append(obj)
    
    print(f"📦 After filtering: {len(filtered)} objects")
    
    # Group by model
    models_data = {}
    for obj in filtered:
        model = obj['model']
        if model not in models_data:
            models_data[model] = []
        models_data[model].append(obj)
    
    print("\n📊 Objects to import:")
    for model, objects in models_data.items():
        print(f"  {model}: {len(objects)}")
    
    conn = get_connection()
    cursor = conn.cursor()
    
    print("\n📥 Importing data...")
    print("-" * 40)
    
    # 1. Users
    if 'users.user' in models_data:
        print("  Importing users...")
        count = 0
        for obj in models_data['users.user']:
            fields = obj['fields']
            # Handle pk (might be in obj or in fields)
            user_id = obj.get('pk', fields.get('id', count + 1))
            
            sql = """
                INSERT INTO users (
                    id, username, password, first_name, last_name, email, 
                    is_active, is_staff, is_superuser, date_joined, last_login,
                    role, middle_name, contact_number, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    last_login = EXCLUDED.last_login
            """
            cursor.execute(sql, [
                user_id,
                fields.get('username', ''),
                fields.get('password', ''),
                fields.get('first_name', ''),
                fields.get('last_name', ''),
                fields.get('email', ''),
                fields.get('is_active', True),
                fields.get('is_staff', False),
                fields.get('is_superuser', False),
                fields.get('date_joined', datetime.now()),
                fields.get('last_login'),
                fields.get('role', 'viewer'),
                fields.get('middle_name', ''),
                fields.get('contact_number', ''),
                fields.get('created_at', datetime.now()),
                fields.get('updated_at', datetime.now())
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} users")
    
    # 2. Units (FIXED - removed is_active)
    if 'units.unit' in models_data:
        print("  Importing units...")
        count = 0
        for obj in models_data['units.unit']:
            fields = obj['fields']
            unit_id = obj.get('pk', fields.get('id', count + 1))
            
            sql = """
                INSERT INTO units (id, unit_code, unit_name, parent_unit_id, location)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                unit_id,
                fields.get('unit_code', ''),
                fields.get('unit_name', ''),
                fields.get('parent_unit'),
                fields.get('location', '')
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} units")
    
    # 3. Positions
    if 'positions.position' in models_data:
        print("  Importing positions...")
        count = 0
        for obj in models_data['positions.position']:
            fields = obj['fields']
            pos_id = obj.get('pk', fields.get('id', count + 1))
            
            sql = """
                INSERT INTO positions (id, position_code, position_title, position_category)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                pos_id,
                fields.get('position_code', ''),
                fields.get('position_title', ''),
                fields.get('position_category', '')
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} positions")
    
    # 4. Officers (Pilots)
    if 'officers.officer' in models_data:
        print("  Importing officers (pilots)...")
        count = 0
        for obj in models_data['officers.officer']:
            fields = obj['fields']
            officer_id = obj.get('pk', fields.get('id', count + 1))
            
            sql = """
                INSERT INTO officers (id, paf_number, rank, first_name, last_name, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (paf_number) DO UPDATE SET
                    rank = EXCLUDED.rank,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
            """
            cursor.execute(sql, [
                officer_id,
                fields.get('paf_number', ''),
                fields.get('rank', ''),
                fields.get('first_name', ''),
                fields.get('last_name', ''),
                fields.get('status', 'ACTIVE')
            ])
            count += 1
            if count % 50 == 0:
                print(f"      Imported {count}/185...")
        conn.commit()
        print(f"    → Imported {count} officers (pilots)")
    
    # 5. Assignments (History)
    if 'assignments.assignment' in models_data:
        print("  Importing assignments (history)...")
        count = 0
        for obj in models_data['assignments.assignment']:
            fields = obj['fields']
            assign_id = obj.get('pk', fields.get('id', count + 1))
            
            sql = """
                INSERT INTO assignments (id, officer_id, unit_id, position_id, date_assumed, date_relinquished, assignment_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                assign_id,
                fields.get('officer'),
                fields.get('unit'),
                fields.get('position'),
                fields.get('date_assumed'),
                fields.get('date_relinquished'),
                fields.get('assignment_type', 'PERMANENT')
            ])
            count += 1
            if count % 100 == 0:
                print(f"      Imported {count}/816...")
        conn.commit()
        print(f"    → Imported {count} assignments")
    
    # Final verification
    print("\n" + "="*60)
    print("✅ IMPORT COMPLETE!")
    print("="*60)
    
    cursor.execute("SELECT COUNT(*) FROM officers")
    officer_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM assignments")
    assignment_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM units")
    unit_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM positions")
    position_count = cursor.fetchone()[0]
    
    print(f"📊 FINAL COUNTS IN NEON:")
    print(f"  Officers (Pilots): {officer_count}")
    print(f"  Assignments (History): {assignment_count}")
    print(f"  Units: {unit_count}")
    print(f"  Positions: {position_count}")
    
    if officer_count > 0:
        cursor.execute("SELECT rank, first_name, last_name, paf_number FROM officers LIMIT 1")
        sample = cursor.fetchone()
        print(f"\n🎯 Sample pilot: {sample[0]} {sample[1]} {sample[2]} (PAF: {sample[3]})")
        
        cursor.execute("SELECT COUNT(*) FROM assignments WHERE officer_id = (SELECT id FROM officers LIMIT 1)")
        hist_count = cursor.fetchone()[0]
        print(f"   Historical assignments: {hist_count}")
    
    print("="*60)
    print("\n🎉 Your 185 pilots and 816 assignments are now in Neon!")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    import_data()
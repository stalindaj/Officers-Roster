#!/usr/bin/env python
"""Import data using raw SQL - Neon compatible"""
import json
import os
import sys
import psycopg2

# Database connection from environment
DB_HOST = os.environ.get('DB_HOST', 'postgres')
DB_PORT = os.environ.get('DB_PORT', '5432')
DB_NAME = os.environ.get('DB_NAME', 'officer_tracking_new')
DB_USER = os.environ.get('DB_USER', 'officer_admin')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'secure_password_123')
SSLMODE = os.environ.get('SSLMODE', 'disable')

def get_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        sslmode=SSLMODE
    )

def fast_import():
    print("\n" + "="*60)
    print("🚀 NEON IMPORT - PILOTS & ASSIGNMENTS")
    print("="*60)
    
    # Load JSON data
    json_file = '/app/import_data.json'
    if not os.path.exists(json_file):
        print(f"❌ File not found: {json_file}")
        return
    
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    print(f"\n📦 Loaded {len(data)} objects")
    
    # Check the structure of first object
    if len(data) > 0:
        print(f"Sample object keys: {list(data[0].keys())}")
    
    # Group by model
    models_data = {}
    for obj in data:
        model = obj.get('model', '')
        # Only include main tables, not historical ones
        if model and not '.historical' in model and model not in ['audit.auditlog']:
            if model not in models_data:
                models_data[model] = []
            models_data[model].append(obj)
    
    print(f"\n📊 Objects to import:")
    for model, objects in models_data.items():
        print(f"  {model}: {len(objects)}")
    
    # Get connection
    conn = get_connection()
    cursor = conn.cursor()
    
    # Import in order
    print("\n📥 Importing data...")
    print("-" * 40)
    
    # 1. Users
    if 'users.user' in models_data:
        print("  Importing users...")
        count = 0
        for obj in models_data['users.user']:
            fields = obj.get('fields', {})
            pk = obj.get('pk', obj.get('id'))
            sql = """
                INSERT INTO users_user (id, username, password, first_name, last_name, email, is_active, is_staff, is_superuser, date_joined)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, COALESCE(%s, NOW()))
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
            """
            cursor.execute(sql, [
                pk,
                fields.get('username', ''),
                fields.get('password', ''),
                fields.get('first_name', ''),
                fields.get('last_name', ''),
                fields.get('email', ''),
                fields.get('is_active', True),
                fields.get('is_staff', False),
                fields.get('is_superuser', False),
                fields.get('date_joined')
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} users")
    
    # 2. Units
    if 'units.unit' in models_data:
        print("  Importing units...")
        count = 0
        for obj in models_data['units.unit']:
            fields = obj.get('fields', {})
            pk = obj.get('pk', obj.get('id'))
            sql = """
                INSERT INTO units_unit (id, unit_code, unit_name, parent_unit_id, location)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                pk,
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
            fields = obj.get('fields', {})
            pk = obj.get('pk', obj.get('id'))
            sql = """
                INSERT INTO positions_position (id, position_code, position_title, position_category)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                pk,
                fields.get('position_code', ''),
                fields.get('position_title', ''),
                fields.get('position_category', '')
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} positions")
    
    # 4. Officers (Pilots) - MOST IMPORTANT
    if 'officers.officer' in models_data:
        print("  Importing officers (pilots)...")
        count = 0
        for obj in models_data['officers.officer']:
            fields = obj.get('fields', {})
            pk = obj.get('pk', obj.get('id'))
            sql = """
                INSERT INTO officers_officer (id, paf_number, rank, first_name, last_name, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (paf_number) DO UPDATE SET
                    rank = EXCLUDED.rank,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    status = EXCLUDED.status
            """
            cursor.execute(sql, [
                pk,
                fields.get('paf_number', ''),
                fields.get('rank', ''),
                fields.get('first_name', ''),
                fields.get('last_name', ''),
                fields.get('status', 'ACTIVE')
            ])
            count += 1
            if count % 50 == 0:
                print(f"      Imported {count}/...")
        conn.commit()
        print(f"    → Imported {count} officers (pilots)")
    
    # 5. Assignments (History) - MOST IMPORTANT
    if 'assignments.assignment' in models_data:
        print("  Importing assignments (history)...")
        count = 0
        for obj in models_data['assignments.assignment']:
            fields = obj.get('fields', {})
            pk = obj.get('pk', obj.get('id'))
            sql = """
                INSERT INTO assignments_assignment (id, officer_id, unit_id, position_id, date_assumed, date_relinquished, assignment_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                pk,
                fields.get('officer'),
                fields.get('unit'),
                fields.get('position'),
                fields.get('date_assumed'),
                fields.get('date_relinquished'),
                fields.get('assignment_type', 'PERMANENT')
            ])
            count += 1
            if count % 100 == 0:
                print(f"      Imported {count}/...")
        conn.commit()
        print(f"    → Imported {count} assignments")
    
    # Final counts
    print("\n" + "="*60)
    print("✅ IMPORT COMPLETE!")
    print("="*60)
    
    cursor.execute("SELECT COUNT(*) FROM officers_officer")
    officer_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM assignments_assignment")
    assignment_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM units_unit")
    unit_count = cursor.fetchone()[0]
    
    print(f"📊 FINAL COUNTS IN NEON:")
    print(f"  Officers (Pilots): {officer_count}")
    print(f"  Assignments (History): {assignment_count}")
    print(f"  Units: {unit_count}")
    
    if officer_count > 0:
        cursor.execute("SELECT rank, first_name, last_name, paf_number FROM officers_officer LIMIT 1")
        sample = cursor.fetchone()
        print(f"\n🎯 Sample pilot: {sample[0]} {sample[1]} {sample[2]} (PAF: {sample[3]})")
        
        # Show assignment count for sample pilot
        cursor.execute("SELECT COUNT(*) FROM assignments_assignment WHERE officer_id = (SELECT id FROM officers_officer LIMIT 1)")
        assignment_sample = cursor.fetchone()[0]
        print(f"   Historical assignments: {assignment_sample}")
    
    print("="*60)
    print("\n🎉 Your pilots and their history are now in Neon!")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    fast_import()
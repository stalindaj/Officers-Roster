#!/usr/bin/env python
"""Import data using raw SQL - bypasses Django model issues"""
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
    print("🚀 RAW SQL IMPORT TO NEON DATABASE")
    print("="*60)
    
    # Load JSON data
    json_file = '/app/import_data.json'
    if not os.path.exists(json_file):
        print(f"❌ File not found: {json_file}")
        return
    
    with open(json_file, 'r') as f:
        data = json.load(f)
    
    print(f"\n📦 Loaded {len(data)} objects")
    
    # Group by model
    models_data = {}
    for obj in data:
        model = obj['model']
        if model not in models_data:
            models_data[model] = []
        models_data[model].append(obj)
    
    print("\n📊 Objects to import:")
    for model, objects in models_data.items():
        print(f"  {model}: {len(objects)}")
    
    # Get connection
    conn = get_connection()
    cursor = conn.cursor()
    
    # Disable triggers for faster import
    cursor.execute("SET session_replication_role = 'replica';")
    
    # Clear existing data (optional)
    print("\n🗑️  Clearing existing data...")
    tables = ['assignments_assignment', 'officers_officer', 'units_unit', 'positions_position', 'users_user']
    for table in tables:
        try:
            cursor.execute(f"TRUNCATE TABLE {table} CASCADE;")
            print(f"  Cleared {table}")
        except:
            pass
    
    # Import in order
    print("\n📥 Importing data...")
    print("-" * 40)
    
    # 1. Users
    if 'users.user' in models_data:
        print("  Importing users...")
        count = 0
        for obj in models_data['users.user']:
            fields = obj['fields']
            sql = """
                INSERT INTO users_user (id, username, password, first_name, last_name, email, is_active, is_staff, is_superuser, date_joined)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                obj['pk'],
                fields.get('username', ''),
                fields.get('password', ''),
                fields.get('first_name', ''),
                fields.get('last_name', ''),
                fields.get('email', ''),
                fields.get('is_active', True),
                fields.get('is_staff', False),
                fields.get('is_superuser', False)
            ])
            count += 1
        conn.commit()
        print(f"    → Imported {count} users")
    
    # 2. Units
    if 'units.unit' in models_data:
        print("  Importing units...")
        count = 0
        for obj in models_data['units.unit']:
            fields = obj['fields']
            sql = """
                INSERT INTO units_unit (id, unit_code, unit_name, parent_unit_id, location)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                obj['pk'],
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
            sql = """
                INSERT INTO positions_position (id, position_code, position_title, position_category)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                obj['pk'],
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
            sql = """
                INSERT INTO officers_officer (id, paf_number, rank, first_name, last_name, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                obj['pk'],
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
    
    # 5. Assignments (History)
    if 'assignments.assignment' in models_data:
        print("  Importing assignments (history)...")
        count = 0
        for obj in models_data['assignments.assignment']:
            fields = obj['fields']
            sql = """
                INSERT INTO assignments_assignment (id, officer_id, unit_id, position_id, date_assumed, date_relinquished, assignment_type)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """
            cursor.execute(sql, [
                obj['pk'],
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
    
    # Re-enable triggers
    cursor.execute("SET session_replication_role = 'origin';")
    
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
    
    print("="*60)
    print("\n🎉 Your pilots and their history are now in Neon!")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    fast_import()
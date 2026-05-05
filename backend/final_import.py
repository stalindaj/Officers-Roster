#!/usr/bin/env python
"""Final import script for Neon - FULLY FIXED VERSION"""
import json
import os
import psycopg2

# DB config
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
    print("\n" + "=" * 60)
    print("🚀 FINAL IMPORT - PILOTS & ASSIGNMENTS TO NEON")
    print("=" * 60)

    # Load JSON
    with open('/app/import_data.json', 'r') as f:
        data = json.load(f)

    print(f"\n📦 Loaded {len(data)} objects")

    # Filter out historical
    filtered = [obj for obj in data if 'historical' not in obj['model']]
    print(f"📦 After filtering: {len(filtered)} objects")

    # Group by model
    models_data = {}
    for obj in filtered:
        models_data.setdefault(obj['model'], []).append(obj)

    print("\n📊 Objects to import:")
    for model, objs in models_data.items():
        print(f"  {model}: {len(objs)}")

    conn = get_connection()
    cursor = conn.cursor()

    print("\n📥 Importing data...")
    print("-" * 40)

    # ========================================
    # 1. USERS (NO PK → GENERATE)
    # ========================================
    if 'users.user' in models_data:
        print("  Importing users...")

        cursor.execute("SELECT COALESCE(MAX(id), 0) FROM users")
        user_id = cursor.fetchone()[0]

        count = 0
        for obj in models_data['users.user']:
            fields = obj['fields']
            user_id += 1

            sql = """
                INSERT INTO users (
                    id, username, password, first_name, last_name,
                    email, is_active, is_staff, is_superuser,
                    date_joined, role,
                    middle_name, contact_number,
                    created_at, updated_at
                )
                VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    COALESCE(%s, NOW()), %s,
                    %s, %s,
                    COALESCE(%s, NOW()), COALESCE(%s, NOW())
                )
                ON CONFLICT (id) DO NOTHING
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
                fields.get('date_joined'),
                fields.get('role', 'viewer'),  # REQUIRED FIELD
                fields.get('middle_name', ''),
                fields.get('contact_number', ''),
                fields.get('created_at'),
                fields.get('updated_at')
            ])

            count += 1

        conn.commit()
        print(f"    → Imported {count} users")

    # ========================================
    # 2. UNITS (USE PK, FIXED SCHEMA)
    # ========================================
    if 'units.unit' in models_data:
        print("  Importing units...")
        count = 0

        for obj in models_data['units.unit']:
            fields = obj['fields']

            sql = """
                INSERT INTO units (id, unit_code, unit_name, parent_unit_id)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """

            cursor.execute(sql, [
                obj['pk'],
                fields.get('unit_code', ''),
                fields.get('unit_name', ''),
                fields.get('parent_unit')
            ])

            count += 1

        conn.commit()
        print(f"    → Imported {count} units")

    # ========================================
    # 3. POSITIONS (USE PK)
    # ========================================
    if 'positions.position' in models_data:
        print("  Importing positions...")
        count = 0

        for obj in models_data['positions.position']:
            fields = obj['fields']

            sql = """
                INSERT INTO positions (id, position_code, position_title, position_category)
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

    # ========================================
    # 4. OFFICERS (USE PK)
    # ========================================
    if 'officers.officer' in models_data:
        print("  Importing officers (pilots)...")
        count = 0

        for obj in models_data['officers.officer']:
            fields = obj['fields']

            sql = """
                INSERT INTO officers (id, paf_number, rank, first_name, last_name, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (paf_number) DO UPDATE SET
                    rank = EXCLUDED.rank,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name
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
                print(f"      Imported {count}/185...")

        conn.commit()
        print(f"    → Imported {count} officers")

    # ========================================
    # 5. ASSIGNMENTS (USE PK)
    # ========================================
    if 'assignments.assignment' in models_data:
        print("  Importing assignments...")
        count = 0

        for obj in models_data['assignments.assignment']:
            fields = obj['fields']

            sql = """
                INSERT INTO assignments (
                    id, officer_id, unit_id, position_id,
                    date_assumed, date_relinquished, assignment_type
                )
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
                print(f"      Imported {count}/816...")

        conn.commit()
        print(f"    → Imported {count} assignments")

    print("\n" + "=" * 60)
    print("✅ IMPORT COMPLETE!")
    print("=" * 60)

    cursor.close()
    conn.close()


if __name__ == "__main__":
    import_data()
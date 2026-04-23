# full_excel_analysis.py
import pandas as pd
import json
import sys
import os

def analyze_excel_completely(excel_path):
    """
    Complete analysis of all sheets with actual data samples
    """
    print("\n" + "="*100)
    print("📊 COMPLETE EXCEL ANALYSIS FOR DATABASE DESIGN")
    print("="*100)
    
    excel_file = pd.ExcelFile(excel_path)
    
    all_analysis = {}
    
    for sheet_name in excel_file.sheet_names:
        print(f"\n\n{'='*100}")
        print(f"📋 SHEET: '{sheet_name}'")
        print('='*100)
        
        try:
            # Read the sheet
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
            
            # Clean column names
            df.columns = [str(col).strip().replace('\n', ' ').replace('\r', '') for col in df.columns]
            
            # Remove completely empty rows
            df = df.dropna(how='all')
            
            print(f"\n📏 SIZE: {len(df)} rows × {len(df.columns)} columns")
            
            # Show ALL column names with their data types and samples
            print(f"\n📋 COLUMNS FOUND:")
            print("-"*80)
            for i, col in enumerate(df.columns, 1):
                non_null = df[col].notna().sum()
                null_pct = ((len(df) - non_null) / len(df) * 100) if len(df) > 0 else 0
                dtype = df[col].dtype
                
                # Get sample value
                sample_values = df[col].dropna().head(2).tolist()
                sample_str = str(sample_values[0])[:50] if sample_values else "NULL"
                
                print(f"  {i:2}. {str(col):35} | Type: {str(dtype):12} | Null: {null_pct:5.1f}% | Sample: {sample_str}")
            
            # Show actual data sample
            print(f"\n📝 ACTUAL DATA (First 8 rows):")
            print("-"*80)
            print(df.head(8).to_string())
            
            # Detect potential keys and relationships
            print(f"\n🔗 KEY DETECTION:")
            print("-"*80)
            
            for col in df.columns:
                non_null = df[col].dropna()
                if len(non_null) == 0:
                    continue
                    
                col_str = str(col).upper()
                
                # Check for officer IDs (pattern: O-xxxxx)
                officer_matches = non_null.astype(str).str.contains(r'O-\d+', na=False)
                if officer_matches.any():
                    officer_ids = non_null[officer_matches].head(3).tolist()
                    print(f"  ✅ '{col}' contains OFFICER IDs: {officer_ids}")
                
                # Check for unit codes (patterns like 460AMG, 16AS, 461FWFMS)
                unit_matches = non_null.astype(str).str.match(r'^\d+[A-Z]+$', na=False)
                if unit_matches.any():
                    units = non_null[unit_matches].head(3).tolist()
                    print(f"  🏢 '{col}' contains UNIT codes: {units}")
                
                # Check for date columns
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    if len(non_null) > 0:
                        min_date = non_null.min()
                        max_date = non_null.max()
                        print(f"  📅 '{col}' is DATE column: {min_date.date()} to {max_date.date()}")
                
                # Check for rank columns
                ranks = ['LTC', 'MAJ', 'CPT', '1LT', '2LT', 'O-6', 'O-5', 'O-4', 'O-3', 'O-2', 'O-1']
                rank_matches = non_null.astype(str).str.upper().isin(ranks)
                if rank_matches.any():
                    unique_ranks = non_null[rank_matches].astype(str).str.upper().unique()[:5]
                    print(f"  ⭐ '{col}' contains RANKS: {list(unique_ranks)}")
                
                # Check if this column has unique values (potential primary key)
                if len(non_null) == len(df) and non_null.nunique() == len(df):
                    print(f"  🔑 '{col}' is a CANDIDATE PRIMARY KEY (all unique, no nulls)")
            
            # Look for relationship clues
            print(f"\n🔗 RELATIONSHIP CLUES:")
            print("-"*80)
            
            # Check columns that might reference other sheets
            for col in df.columns:
                col_lower = str(col).lower()
                if 'name' in col_lower and 'officer' not in col_lower:
                    print(f"  👤 '{col}' likely references OFFICER names")
                elif 'unit' in col_lower or 'station' in col_lower:
                    print(f"  🏛️ '{col}' likely references UNITS")
                elif 'position' in col_lower:
                    print(f"  💼 '{col}' likely references POSITIONS")
            
            # Store analysis
            all_analysis[sheet_name] = {
                'rows': len(df),
                'columns': list(df.columns.astype(str)),
                'sample_data': df.head(10).to_dict('records')
            }
            
        except Exception as e:
            print(f"⚠️ Error analyzing sheet '{sheet_name}': {e}")
            continue
    
    # Generate summary
    print(f"\n\n{'='*100}")
    print("📊 SUMMARY - WHAT I LEARNED FROM YOUR DATA")
    print('='*100)
    
    print("""
    PRIMARY ENTITIES IDENTIFIED:
    ───────────────────────────
    • OFFICERS - Personnel with O-xxxxx IDs (e.g., O-135535, O-143160)
    • UNITS - Military organizations (460AMG, 16AS, 17AS, 461FWFMS, 462RWFMS, 463AAMS, 464SSS, etc.)
    • POSITIONS - Job titles (Squadron Commander, Executive Officer, Operations Officer, etc.)
    • ASSIGNMENTS - History of officers to units/positions with dates
    • FLIGHT HOURS - From SLL sheet (flying time data)
    • QUALIFICATIONS/RATINGS - From SLL sheet (points, ratings)
    
    RELATIONSHIPS OBSERVED:
    ───────────────────────
    • Each sheet represents a UNIT's assignments
    • Each row connects: OFFICER → POSITION → UNIT with date range
    • SLL sheet connects OFFICER → FLYING HOURS + QUALIFICATIONS
    • ASSIGNED 15SW shows CURRENT assignments
    • DS TO OTHER UNIT shows temporary/detailed assignments
    • w TO shows succession planning
    
    QUESTIONS FOR YOU (Please answer):
    ──────────────────────────────────
    1. Is the SLL sheet a SNAPSHOT (current status) or HISTORICAL?
    2. Are the points in SLL recalculated periodically?
    3. Should "DS TO OTHER UNIT" be a flag or separate table?
    4. What is your PRIMARY query need? (Current assignments? History? Reports?)
    """)
    
    # Save to file
    with open('excel_analysis_complete.json', 'w') as f:
        json.dump(all_analysis, f, indent=2, default=str)
    
    print(f"\n✅ Complete analysis saved to: excel_analysis_complete.json")
    return all_analysis

if __name__ == "__main__":
    # Hardcoded path for convenience
    excel_path = "data/Copy of 15SW Officer and Pilot Career Development Program.xlsx"
    
    # Check if file exists
    if not os.path.exists(excel_path):
        print(f"❌ File not found: {excel_path}")
        print(f"   Current directory: {os.getcwd()}")
        print(f"   Files in current directory: {os.listdir('.')}")
        
        # Try alternate path
        alt_path = "Copy of 15SW Officer and Pilot Career Development Program.xlsx"
        if os.path.exists(alt_path):
            excel_path = alt_path
            print(f"✅ Found file at: {excel_path}")
        else:
            sys.exit(1)
    
    analyze_excel_completely(excel_path)
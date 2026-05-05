# backend/apps/common/excel_import.py
import pandas as pd
from datetime import datetime

class ExcelImporter:
    """Generic Excel importer for officers, assignments, flight logs"""
    
    def __init__(self, file_path, model, field_mapping):
        """
        file_path: path to Excel file
        model: Django model to import into
        field_mapping: dict mapping Excel columns to model fields
        """
        self.file_path = file_path
        self.model = model
        self.field_mapping = field_mapping
        self.errors = []
        self.success_count = 0
    
    def import_data(self):
        df = pd.read_excel(self.file_path)
        
        for index, row in df.iterrows():
            try:
                data = {}
                for excel_col, model_field in self.field_mapping.items():
                    if excel_col in row:
                        value = row[excel_col]
                        # Handle date conversion
                        if isinstance(value, (datetime, pd.Timestamp)):
                            value = value.date()
                        elif pd.isna(value):
                            value = None
                        data[model_field] = value
                
                self.model.objects.update_or_create(**data)
                self.success_count += 1
                
            except Exception as e:
                self.errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            'success': self.success_count,
            'errors': self.errors
        }
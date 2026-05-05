# backend/apps/common/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminOnly
from .excel_import import ExcelImporter
from apps.officers.models import Officer
from apps.assignments.models import Assignment

class ExcelImportView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOnly]
    parser_classes = [MultiPartParser]
    
    def post(self, request):
        file = request.FILES.get('file')
        import_type = request.data.get('type')  # 'officers', 'assignments', 'flight_logs'
        
        if not file:
            return Response({'error': 'No file provided'}, status=400)
        
        if import_type == 'officers':
            mapping = {
                'PAF Number': 'paf_number',
                'Rank': 'rank',
                'First Name': 'first_name',
                'Last Name': 'last_name',
                'Status': 'status',
                'Date Commissioned': 'date_commissioned',
            }
            importer = ExcelImporter(file, Officer, mapping)
            
        elif import_type == 'assignments':
            mapping = {
                'Officer PAF': 'officer__paf_number',
                'Unit Code': 'unit__unit_code',
                'Position Title': 'position__position_title',
                'Date Assumed': 'date_assumed',
                'Date Relinquished': 'date_relinquished',
            }
            importer = ExcelImporter(file, Assignment, mapping)
        else:
            return Response({'error': 'Invalid import type'}, status=400)
        
        result = importer.import_data()
        
        return Response({
            'success': result['success'],
            'errors': result['errors']
        })
// frontend/src/pages/AdminDataEntry.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function AdminDataEntry() {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [activeTab, setActiveTab] = useState('officers');

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', activeTab);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_BASE}/admin/import/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setUploadResult(response.data);
    } catch (error) {
      setUploadResult({ error: error.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Data Entry Dashboard</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Bulk Import from Excel</h2>
        
        {/* Tab buttons */}
        <div className="flex gap-2 mb-4 border-b">
          {['officers', 'assignments', 'flight_logs'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 ${activeTab === tab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              {tab.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        
        {/* Upload area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {uploading ? 'Uploading...' : 'Select Excel File'}
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Upload Excel file with columns matching the template
          </p>
        </div>
        
        {/* Results */}
        {uploadResult && (
          <div className={`mt-4 p-4 rounded ${uploadResult.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {uploadResult.error || `${uploadResult.success} records imported successfully`}
            {uploadResult.errors?.length > 0 && (
              <div className="mt-2 text-sm">
                <strong>Errors:</strong>
                <ul className="list-disc pl-5">
                  {uploadResult.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Quick add forms */}
      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Add Officer</h2>
          <p className="text-gray-500 text-sm">Use Django Admin for full control →</p>
          <a href="/admin" className="mt-2 inline-block text-blue-600">Go to Admin Panel</a>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Add Assignment</h2>
          <p className="text-gray-500 text-sm">Use Django Admin for full control →</p>
          <a href="/admin" className="mt-2 inline-block text-blue-600">Go to Admin Panel</a>
        </div>
      </div>
    </div>
  );
}

export default AdminDataEntry;
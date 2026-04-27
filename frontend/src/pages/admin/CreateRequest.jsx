import { API_BASE } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function CreateRequest() {
  const [requestType, setRequestType] = useState('OFFICER_CREATE');
  const [formData, setFormData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [units, setUnits] = useState([]);
  const [positions, setPositions] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  useEffect(() => {
    // Fetch officers for dropdowns
    axios.get(`${API_BASE}/officers/officers/?page_size=500`, getAuthHeader())
      .then(res => setOfficers(res.data.results || []))
      .catch(console.error);
    
    axios.get(`${API_BASE}/units/units/`, getAuthHeader())
      .then(res => setUnits(res.data.results || []))
      .catch(console.error);
    
    axios.get(`${API_BASE}/positions/positions/`, getAuthHeader())
      .then(res => setPositions(res.data.results || []))
      .catch(console.error);
  }, []);

  const requestTypes = [
    { value: 'OFFICER_CREATE', label: 'Create New Officer', icon: '👨‍✈️' },
    { value: 'OFFICER_UPDATE', label: 'Update Officer Information', icon: '✏️' },
    { value: 'FLIGHT_HOURS_ADD', label: 'Add Flight Hours', icon: '✈️' },
    { value: 'ASSIGNMENT_ADD', label: 'Add Assignment (Career History)', icon: '📋' },
    { value: 'PROMOTION_POINTS_ADD', label: 'Add Promotion Points', icon: '⭐' },
    { value: 'QUALIFICATION_ADD', label: 'Add Qualification/Rating', icon: '🎓' },
    { value: 'BULK_IMPORT', label: 'Bulk Import (Excel Upload)', icon: '📊' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const requestData = new FormData();
    requestData.append('request_type', requestType);
    requestData.append('data', JSON.stringify(formData));
    
    if (selectedFile) {
      requestData.append('file', selectedFile);
    }
    
    try {
      await axios.post(`${API_BASE}/requests/requests/`, requestData, {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      });
      alert('Request submitted successfully! Waiting for super admin approval.');
      resetForm();
    } catch (error) {
      console.error(error);
      alert('Error submitting request');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setRequestType('OFFICER_CREATE');
    setFormData({});
    setSelectedFile(null);
  };

  const renderForm = () => {
    switch (requestType) {
      case 'OFFICER_CREATE':
        return (
          <div className="space-y-3">
            <input type="text" placeholder="PAF Number (O-XXXXX)" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, paf_number: e.target.value})} />
            <select className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, rank: e.target.value})}>
              <option value="">Select Rank</option>
              <option value="2LT">2LT - Second Lieutenant</option>
              <option value="1LT">1LT - First Lieutenant</option>
              <option value="CPT">CPT - Captain</option>
              <option value="MAJ">MAJ - Major</option>
              <option value="LTC">LTC - Lieutenant Colonel</option>
            </select>
            <input type="text" placeholder="First Name" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
            <input type="text" placeholder="Last Name" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
            <input type="text" placeholder="Middle Name" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, middle_name: e.target.value})} />
          </div>
        );
      
      case 'FLIGHT_HOURS_ADD':
        return (
          <div className="space-y-3">
            <select className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, officer_id: e.target.value})}>
              <option value="">Select Officer</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.rank} {o.first_name} {o.last_name}</option>)}
            </select>
            <input type="date" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, flight_date: e.target.value})} />
            <input type="number" step="0.1" placeholder="Flight Hours" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, flight_hours: e.target.value})} />
            <input type="text" placeholder="Aircraft Type (e.g., AW-109AH)" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, aircraft_type: e.target.value})} />
            <textarea placeholder="Remarks" className="w-full px-3 py-2 border rounded" rows="2" onChange={(e) => setFormData({...formData, remarks: e.target.value})} />
          </div>
        );
      
      case 'ASSIGNMENT_ADD':
        return (
          <div className="space-y-3">
            <select className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, officer_id: e.target.value})}>
              <option value="">Select Officer</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.rank} {o.first_name} {o.last_name}</option>)}
            </select>
            <select className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, unit_id: e.target.value})}>
              <option value="">Select Unit</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
            </select>
            <select className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, position_id: e.target.value})}>
              <option value="">Select Position</option>
              {positions.map(p => <option key={p.id} value={p.id}>{p.position_title}</option>)}
            </select>
            <input type="date" placeholder="Date Assumed" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, date_assumed: e.target.value})} />
            <input type="date" placeholder="Date Relinquished (leave blank if current)" className="w-full px-3 py-2 border rounded" onChange={(e) => setFormData({...formData, date_relinquished: e.target.value})} />
          </div>
        );
      
      case 'BULK_IMPORT':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input type="file" accept=".xlsx,.xls" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-gray-600">Click to upload Excel file</p>
                <p className="text-xs text-gray-400 mt-1">Accepted: .xlsx, .xls</p>
              </label>
            </div>
            {selectedFile && <p className="text-green-600">Selected: {selectedFile.name}</p>}
            <textarea placeholder="Additional notes for verifier" className="w-full px-3 py-2 border rounded" rows="3" onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </div>
        );
      
      default:
        return <div>Select a request type above</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Create New Request</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Request Type</label>
          <select value={requestType} onChange={(e) => setRequestType(e.target.value)} className="w-full px-3 py-2 border rounded">
            {requestTypes.map(rt => (
              <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>
            ))}
          </select>
        </div>
        
        {renderForm()}
        
        <div className="mt-6">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit Request for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRequest;
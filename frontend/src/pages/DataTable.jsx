import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function DataTable() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('history');
  
  // Edit states
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editFormData, setEditFormData] = useState({
    rank: '',
    status: '',
    date_commissioned: ''
  });
  const [updating, setUpdating] = useState(false);
  
  // Flight Hours states
  const [currentYearHours, setCurrentYearHours] = useState(0);
  const [flightHoursRequired, setFlightHoursRequired] = useState(100);
  const [flightHoursStatus, setFlightHoursStatus] = useState({ color: 'gray', message: '' });
  const [showFlightForm, setShowFlightForm] = useState(false);
  const [newFlightLog, setNewFlightLog] = useState({
    flight_date: '',
    flight_hours: '',
    aircraft_type: '',
    mission_type: '',
    remarks: ''
  });

  // Add Officer states
  const [showAddOfficerForm, setShowAddOfficerForm] = useState(false);
  const [newOfficer, setNewOfficer] = useState({
    paf_number: '',
    rank: '2LT',
    first_name: '',
    last_name: '',
    middle_name: '',
    suffix: '',
    status: 'ACTIVE',
    date_commissioned: ''
  });
  const [addingOfficer, setAddingOfficer] = useState(false);

  // Justifications/Remarks states
  const [justifications, setJustifications] = useState([]);
  const [newJustification, setNewJustification] = useState({
    event_type: '',
    title: '',
    start_date: '',
    end_date: '',
    description: '',
    impact_on_flying: ''
  });
  const [showJustificationForm, setShowJustificationForm] = useState(false);
  
  // Qualifications/Training states
  const [qualifications, setQualifications] = useState([]);
  const [newQualification, setNewQualification] = useState({ type: '', date_earned: '', expiration: '' });
  const [points, setPoints] = useState({ total: 0, breakdown: [] });

  const ranks = ['all', 'LTC', 'MAJ', 'CPT', '1LT', '2LT'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchAllOfficers = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/officers/officers/?page_size=100`;
      if (selectedRank !== 'all') url += `&rank=${selectedRank}`;
      
      const response = await axios.get(url, getAuthHeader());
      
      if (Array.isArray(response.data)) {
        setOfficers(response.data);
      } else if (response.data.results) {
        setOfficers(response.data.results);
      } else {
        setOfficers([]);
      }
    } catch (error) {
      console.error(error);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOfficer = async () => {
    if (!newOfficer.first_name || !newOfficer.last_name) {
      alert('Please enter at least first name and last name');
      return;
    }
    
    setAddingOfficer(true);
    try {
      const response = await axios.post(
        `${API_BASE}/officers/officers/`,
        newOfficer,
        getAuthHeader()
      );
      
      setOfficers([response.data, ...officers]);
      setShowAddOfficerForm(false);
      setNewOfficer({
        paf_number: '',
        rank: '2LT',
        first_name: '',
        last_name: '',
        middle_name: '',
        suffix: '',
        status: 'ACTIVE',
        date_commissioned: ''
      });
      alert('✅ Officer added successfully!');
    } catch (error) {
      console.error('Error adding officer:', error);
      alert('❌ Error adding officer: ' + (error.response?.data?.detail || error.message));
    } finally {
      setAddingOfficer(false);
    }
  };

  const fetchOfficerDetails = async (officerId) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE}/officers/officers/${officerId}/`, getAuthHeader());
      setCareerHistory(response.data.career_history || []);
      setSelectedOfficer(response.data);
      await fetchFlightHours(officerId);
      await fetchJustifications(officerId);
    } catch (error) {
      console.error(error);
      setCareerHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFlightHours = async (officerId) => {
    try {
      const currentYear = new Date().getFullYear();
      const response = await axios.get(
        `${API_BASE}/flight-logs/flight-logs/?officer=${officerId}`,
        getAuthHeader()
      );
      const logs = response.data.results || response.data || [];
      
      const currentYearLogs = logs.filter(log => {
        const logDate = new Date(log.flight_date);
        return logDate.getFullYear() === currentYear;
      });
      
      const totalHours = currentYearLogs.reduce((sum, log) => sum + (parseFloat(log.flight_hours) || 0), 0);
      setCurrentYearHours(totalHours);
      
      if (totalHours >= flightHoursRequired) {
        setFlightHoursStatus({ color: 'green', message: `✅ Met requirement: ${totalHours}/${flightHoursRequired} hrs` });
      } else {
        const remaining = flightHoursRequired - totalHours;
        setFlightHoursStatus({ color: 'red', message: `⚠️ Short by ${remaining} hrs (${totalHours}/${flightHoursRequired})` });
      }
    } catch (error) {
      console.error('Error fetching flight hours:', error);
      setCurrentYearHours(0);
    }
  };

  const fetchJustifications = async (officerId) => {
    try {
      const response = await axios.get(`${API_BASE}/career-events/?officer=${officerId}`, getAuthHeader());
      setJustifications(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching justifications:', error);
      setJustifications([]);
    }
  };

  const fetchOfficerQualifications = async (officerId) => {
    try {
      const response = await axios.get(`${API_BASE}/qualifications/?officer=${officerId}`, getAuthHeader());
      setQualifications(response.data.results || []);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      setQualifications([]);
    }
  };

  const fetchOfficerPoints = async (officerId) => {
    try {
      const response = await axios.get(`${API_BASE}/promotion-points/?officer=${officerId}`, getAuthHeader());
      setPoints(response.data.results?.[0] || { total: 0, breakdown: [] });
    } catch (error) {
      console.error('Error fetching points:', error);
      setPoints({ total: 0, breakdown: [] });
    }
  };

  const handleEditOfficer = (officer) => {
    setEditingOfficer(officer);
    setEditFormData({
      rank: officer.rank || '',
      status: officer.status || 'ACTIVE',
      date_commissioned: officer.date_commissioned || ''
    });
    fetchOfficerQualifications(officer.id);
    fetchOfficerPoints(officer.id);
  };

  const handleUpdateOfficer = async () => {
    setUpdating(true);
    try {
      const response = await axios.patch(
        `${API_BASE}/officers/officers/${editingOfficer.id}/`,
        editFormData,
        getAuthHeader()
      );
      
      setOfficers(officers.map(o => 
        o.id === editingOfficer.id ? { ...o, ...response.data } : o
      ));
      
      setEditingOfficer(null);
      alert('✅ Officer updated successfully!');
    } catch (error) {
      console.error('Error updating officer:', error);
      alert('❌ Error updating officer: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleAddFlightLog = async () => {
    if (!newFlightLog.flight_date || !newFlightLog.flight_hours || !newFlightLog.aircraft_type) {
      alert('Please fill in date, hours, and aircraft type');
      return;
    }
    
    try {
      await axios.post(
        `${API_BASE}/flight-logs/flight-logs/`,
        {
          officer: selectedOfficer.id,
          flight_date: newFlightLog.flight_date,
          flight_hours: parseFloat(newFlightLog.flight_hours),
          aircraft_type: newFlightLog.aircraft_type,
          mission_type: newFlightLog.mission_type || 'TRAINING',
          remarks: newFlightLog.remarks
        },
        getAuthHeader()
      );
      await fetchFlightHours(selectedOfficer.id);
      setNewFlightLog({ flight_date: '', flight_hours: '', aircraft_type: '', mission_type: '', remarks: '' });
      setShowFlightForm(false);
      alert('✅ Flight hours added successfully!');
    } catch (error) {
      console.error('Error adding flight hours:', error);
      alert('Error adding flight hours: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddJustification = async () => {
    try {
      await axios.post(
        `${API_BASE}/career-events/`,
        {
          officer: selectedOfficer.id,
          ...newJustification
        },
        getAuthHeader()
      );
      await fetchJustifications(selectedOfficer.id);
      setNewJustification({ event_type: '', title: '', start_date: '', end_date: '', description: '', impact_on_flying: '' });
      setShowJustificationForm(false);
      alert('✅ Justification added!');
    } catch (error) {
      console.error('Error adding justification:', error);
      alert('Error adding justification');
    }
  };

  const handleViewDetails = (officer) => {
    setSelectedOfficer(officer);
    fetchOfficerDetails(officer.id);
    fetchOfficerQualifications(officer.id);
    fetchOfficerPoints(officer.id);
    setActiveTab('history');
  };

  const handleAddQualification = async () => {
    try {
      const response = await axios.post(
        `${API_BASE}/qualifications/`,
        {
          officer: selectedOfficer.id,
          ...newQualification
        },
        getAuthHeader()
      );
      setQualifications([...qualifications, response.data]);
      setNewQualification({ type: '', date_earned: '', expiration: '' });
      alert('✅ Qualification added!');
    } catch (error) {
      console.error('Error adding qualification:', error);
      alert('Error adding qualification');
    }
  };

  const handleDeleteQualification = async (qualId) => {
    if (window.confirm('Delete this qualification?')) {
      try {
        await axios.delete(`${API_BASE}/qualifications/${qualId}/`, getAuthHeader());
        setQualifications(qualifications.filter(q => q.id !== qualId));
        alert('✅ Qualification deleted');
      } catch (error) {
        console.error('Error deleting qualification:', error);
      }
    }
  };

  useEffect(() => {
    fetchAllOfficers();
  }, [selectedRank]);

  const filteredOfficers = officers.filter(officer =>
    `${officer.first_name} ${officer.last_name} ${officer.paf_number} ${officer.rank}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank) => {
    const colors = { LTC: 'bg-yellow-600', MAJ: 'bg-purple-600', CPT: 'bg-green-600', '1LT': 'bg-blue-600', '2LT': 'bg-gray-600' };
    return colors[rank] || 'bg-gray-400';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  };

  const getQualificationBadge = (type) => {
    const colors = {
      'PILOT': 'bg-blue-100 text-blue-800',
      'NAVIGATOR': 'bg-green-100 text-green-800',
      'INSTRUCTOR': 'bg-purple-100 text-purple-800',
      'COMMAND': 'bg-red-100 text-red-800',
      'STAFF': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Officers Data Table</h1>
        </div>
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {ranks.map(rank => (
              <button 
                key={rank} 
                onClick={() => setSelectedRank(rank)} 
                className={`px-3 py-1 text-sm rounded ${selectedRank === rank ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                {rank === 'all' ? 'All' : rank}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Search by name, rank, or PAF..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="px-3 py-1 border border-gray-300 rounded text-sm w-80" 
            />
            <button
              onClick={() => setShowAddOfficerForm(true)}
              className="px-4 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
            >
              + Add Officer
            </button>
          </div>
        </div>
        
        {loading ? <div className="text-center py-10">Loading...</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">PAF Number</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Flight Hours</th>
                  <th className="px-4 py-3">Current Unit</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOfficers.map((o, idx) => (
                  <tr key={o.id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-3">{idx+1}</td>
                    <td className="px-4 py-3">{o.paf_number || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getRankBadge(o.rank)}`}>
                        {o.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">{o.first_name} {o.last_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${o.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{Math.round(o.total_flight_hours || 0).toLocaleString()} hrs</td>
                    <td className="px-4 py-3">{o.current_assignment?.unit?.unit_code || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleViewDetails(o)} className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                        <button onClick={() => handleEditOfficer(o)} className="text-green-600 hover:text-green-800 text-sm">Edit</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3 border-t bg-gray-50">
          <span className="text-sm text-gray-600">Showing {filteredOfficers.length} of {officers.length} officers</span>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Officers</p>
          <p className="text-2xl font-bold">{officers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Active Officers</p>
          <p className="text-2xl font-bold">{officers.filter(o => o.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">With Flight Hours</p>
          <p className="text-2xl font-bold">{officers.filter(o => o.total_flight_hours > 0).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">With Current Assignment</p>
          <p className="text-2xl font-bold">{officers.filter(o => o.current_assignment).length}</p>
        </div>
      </div>

      {/* View Details Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOfficer(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedOfficer.rank} {selectedOfficer.first_name} {selectedOfficer.last_name}
                    </h3>
                    <p className="text-blue-200 text-sm mt-1">{selectedOfficer.paf_number}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setSelectedOfficer(null);
                        handleEditOfficer(selectedOfficer);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600"
                    >
                      ✏️ Edit Officer
                    </button>
                    <button onClick={() => setSelectedOfficer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Rank</p>
                    <p className="font-semibold">{selectedOfficer.rank}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <p className="font-semibold text-emerald-600">{selectedOfficer.status}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Flight Hours</p>
                    <p className="font-semibold text-emerald-600">{Math.round(selectedOfficer.total_flight_hours || 0).toLocaleString()} hrs</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Date Commissioned</p>
                    <p className="font-semibold">{formatDate(selectedOfficer.date_commissioned)}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">✈️ Flight Hours Tracker (Current Year)</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Hours Flown This Year</p>
                        <p className="text-3xl font-bold text-blue-700">{currentYearHours} hrs</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Required Annual Hours</p>
                        <p className="text-2xl font-bold text-gray-700">{flightHoursRequired} hrs</p>
                      </div>
                    </div>
                    <div className={`text-sm font-semibold ${flightHoursStatus.color === 'green' ? 'text-green-600' : 'text-red-600'} mb-3`}>
                      {flightHoursStatus.message}
                    </div>
                    
                    <button onClick={() => setShowFlightForm(!showFlightForm)} className="text-sm text-blue-600 hover:text-blue-800">
                      {showFlightForm ? '− Cancel' : '+ Add Flight Hours'}
                    </button>
                    
                    {showFlightForm && (
                      <div className="mt-3 p-3 bg-white rounded-lg border">
                        <div className="grid grid-cols-2 gap-2">
                          <input type="date" value={newFlightLog.flight_date} onChange={(e) => setNewFlightLog({...newFlightLog, flight_date: e.target.value})} className="px-2 py-1 border rounded text-sm" />
                          <input type="number" step="0.1" placeholder="Hours" value={newFlightLog.flight_hours} onChange={(e) => setNewFlightLog({...newFlightLog, flight_hours: e.target.value})} className="px-2 py-1 border rounded text-sm" />
                          <select value={newFlightLog.aircraft_type} onChange={(e) => setNewFlightLog({...newFlightLog, aircraft_type: e.target.value})} className="px-2 py-1 border rounded text-sm">
                            <option value="">Select Aircraft</option>
                            <option value="T-129">T-129 ATAK</option>
                            <option value="AW-109">AW-109AH</option>
                            <option value="MD-520">MD-520MG</option>
                            <option value="SF-260">SF-260TP</option>
                            <option value="OV-10">OV-10 Bronco</option>
                          </select>
                          <select value={newFlightLog.mission_type} onChange={(e) => setNewFlightLog({...newFlightLog, mission_type: e.target.value})} className="px-2 py-1 border rounded text-sm">
                            <option value="">Select Mission</option>
                            <option value="TRAINING">Training</option>
                            <option value="COMBAT">Combat</option>
                            <option value="RECON">Reconnaissance</option>
                            <option value="TRANSPORT">Transport</option>
                            <option value="TEST">Test Flight</option>
                            <option value="MAINTENANCE">Maintenance Flight</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <textarea placeholder="Remarks (optional)" value={newFlightLog.remarks} onChange={(e) => setNewFlightLog({...newFlightLog, remarks: e.target.value})} className="w-full mt-2 px-2 py-1 border rounded text-sm" rows="1" />
                        <button onClick={handleAddFlightLog} className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save Flight Hours</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">📋 Justifications & Remarks</h4>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <button onClick={() => setShowJustificationForm(!showJustificationForm)} className="text-sm text-yellow-700 hover:text-yellow-900 mb-3">
                      + Add Justification
                    </button>
                    
                    {showJustificationForm && (
                      <div className="mb-3 p-3 bg-white rounded-lg border">
                        <select value={newJustification.event_type} onChange={(e) => setNewJustification({...newJustification, event_type: e.target.value})} className="w-full mb-2 px-2 py-1 border rounded text-sm">
                          <option value="">Select Type</option>
                          <option value="GROUNDED">Grounded</option>
                          <option value="TRAINING">Training</option>
                          <option value="ACCIDENT">Accident</option>
                          <option value="MAINTENANCE">Maintenance Issue</option>
                          <option value="AVAILABILITY">Equipment Availability</option>
                          <option value="DS">DS Assignment</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <input type="text" placeholder="Title" value={newJustification.title} onChange={(e) => setNewJustification({...newJustification, title: e.target.value})} className="w-full mb-2 px-2 py-1 border rounded text-sm" />
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input type="date" placeholder="Start Date" value={newJustification.start_date} onChange={(e) => setNewJustification({...newJustification, start_date: e.target.value})} className="px-2 py-1 border rounded text-sm" />
                          <input type="date" placeholder="End Date" value={newJustification.end_date} onChange={(e) => setNewJustification({...newJustification, end_date: e.target.value})} className="px-2 py-1 border rounded text-sm" />
                        </div>
                        <textarea placeholder="Description / Impact on Flying" value={newJustification.description} onChange={(e) => setNewJustification({...newJustification, description: e.target.value})} className="w-full mb-2 px-2 py-1 border rounded text-sm" rows="2" />
                        <button onClick={handleAddJustification} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save Justification</button>
                      </div>
                    )}
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {justifications.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-2">No justifications recorded</p>
                      ) : (
                        justifications.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-2 border">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.event_type === 'GROUNDED' ? 'bg-red-100 text-red-700' : item.event_type === 'TRAINING' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {item.event_type}
                                </span>
                                <p className="font-medium text-sm mt-1">{item.title}</p>
                                <p className="text-xs text-gray-500">{formatDate(item.start_date)} → {formatDate(item.end_date)}</p>
                                <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {selectedOfficer.current_assignment && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Current Assignment</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Unit</p>
                        <p className="font-semibold">{selectedOfficer.current_assignment.unit?.unit_code || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Position</p>
                        <p className="font-semibold text-sm">{selectedOfficer.current_assignment.position?.position_title || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Start Date</p>
                        <p className="font-semibold">{formatDate(selectedOfficer.current_assignment.date_assumed)}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4 border-b">
                  <div className="flex gap-4">
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      📋 Career History ({careerHistory.length})
                    </button>
                    <button onClick={() => setActiveTab('qualifications')} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'qualifications' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      🎓 Qualifications ({qualifications.length})
                    </button>
                    <button onClick={() => setActiveTab('points')} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'points' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                      ⭐ Promotion Points ({points.total || 0})
                    </button>
                  </div>
                </div>

                {activeTab === 'history' && (
                  <div className="overflow-x-auto max-h-96">
                    {loadingHistory ? (
                      <div className="text-center py-10">Loading career history...</div>
                    ) : careerHistory.length === 0 ? (
                      <div className="text-center py-10 text-gray-400">No career history available</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">From</th>
                            <th className="px-3 py-2 text-left">To</th>
                            <th className="px-3 py-2 text-left">Unit</th>
                            <th className="px-3 py-2 text-left">Position</th>
                            <th className="px-3 py-2 text-left">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {careerHistory.map((history, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2">{formatDate(history.date_assumed)}</td>
                              <td className="px-3 py-2">{formatDate(history.date_relinquished)}</td>
                              <td className="px-3 py-2">{history.unit?.unit_code || 'N/A'}</td>
                              <td className="px-3 py-2 max-w-xs truncate">{history.position?.position_title || 'N/A'}</td>
                              <td className="px-3 py-2">{history.assignment_type || 'PERMANENT'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === 'qualifications' && (
                  <div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <input type="text" placeholder="Qualification Type" value={newQualification.type} onChange={(e) => setNewQualification({...newQualification, type: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
                      <input type="date" placeholder="Date Earned" value={newQualification.date_earned} onChange={(e) => setNewQualification({...newQualification, date_earned: e.target.value})} className="px-3 py-2 border rounded-md text-sm" />
                      <button onClick={handleAddQualification} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">+ Add</button>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {qualifications.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No qualifications recorded</div>
                      ) : (
                        qualifications.map((qual, idx) => (
                          <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getQualificationBadge(qual.qualification_type || qual.type)}`}>
                                    {qual.qualification_type || qual.type || 'Qualification'}
                                  </span>
                                  <span className="text-xs text-gray-500">Earned: {formatDate(qual.date_earned)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{qual.name || qual.description || 'No description available'}</p>
                                {qual.expiration_date && <p className="text-xs text-orange-600 mt-1">Expires: {formatDate(qual.expiration_date)}</p>}
                              </div>
                              <button onClick={() => handleDeleteQualification(qual.id)} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'points' && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg">
                    <div className="text-center mb-4">
                      <p className="text-4xl font-bold text-amber-700">{points.total || 0}</p>
                      <p className="text-sm text-gray-600">Total Promotion Points</p>
                    </div>
                    {points.breakdown && points.breakdown.length > 0 && (
                      <div className="space-y-2">
                        {points.breakdown.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm py-1 border-b border-amber-200">
                            <span>{item.category}</span>
                            <span className="font-semibold">{item.points}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <button className="mt-4 w-full px-3 py-2 bg-amber-600 text-white rounded-md text-sm hover:bg-amber-700">Recalculate Points</button>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-lg flex justify-end">
                <button onClick={() => setSelectedOfficer(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Officer Modal */}
      {showAddOfficerForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowAddOfficerForm(false)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowAddOfficerForm(false)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-green-700 to-green-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Add New Officer</h3>
                  <button onClick={() => setShowAddOfficerForm(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAF Number</label>
                    <input type="text" placeholder="O-12345" value={newOfficer.paf_number} onChange={(e) => setNewOfficer({...newOfficer, paf_number: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" value={newOfficer.first_name} onChange={(e) => setNewOfficer({...newOfficer, first_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input type="text" value={newOfficer.last_name} onChange={(e) => setNewOfficer({...newOfficer, last_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input type="text" value={newOfficer.middle_name} onChange={(e) => setNewOfficer({...newOfficer, middle_name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                      <select value={newOfficer.rank} onChange={(e) => setNewOfficer({...newOfficer, rank: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="2LT">2LT - 2nd Lieutenant</option>
                        <option value="1LT">1LT - 1st Lieutenant</option>
                        <option value="CPT">CPT - Captain</option>
                        <option value="MAJ">MAJ - Major</option>
                        <option value="LTC">LTC - Lieutenant Colonel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={newOfficer.status} onChange={(e) => setNewOfficer({...newOfficer, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="RETIRED">RETIRED</option>
                        <option value="DECEASED">DECEASED</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suffix (Jr., Sr., III)</label>
                    <input type="text" placeholder="Jr., Sr., III" value={newOfficer.suffix} onChange={(e) => setNewOfficer({...newOfficer, suffix: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Commissioned</label>
                    <input type="date" value={newOfficer.date_commissioned} onChange={(e) => setNewOfficer({...newOfficer, date_commissioned: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>

                <div className="pt-4 mt-4 flex justify-end gap-3 border-t">
                  <button onClick={() => setShowAddOfficerForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
                  <button onClick={handleAddOfficer} disabled={addingOfficer} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                    {addingOfficer ? 'Adding...' : 'Add Officer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Officer Modal */}
      {editingOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setEditingOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setEditingOfficer(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-green-700 to-green-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">Edit Officer: {editingOfficer.first_name} {editingOfficer.last_name}</h3>
                  <button onClick={() => setEditingOfficer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <p className="text-green-200 text-sm mt-1">{editingOfficer.paf_number}</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                      <select value={editFormData.rank} onChange={(e) => setEditFormData({...editFormData, rank: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="2LT">2LT - 2nd Lieutenant</option>
                        <option value="1LT">1LT - 1st Lieutenant</option>
                        <option value="CPT">CPT - Captain</option>
                        <option value="MAJ">MAJ - Major</option>
                        <option value="LTC">LTC - Lieutenant Colonel</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="RETIRED">RETIRED</option>
                        <option value="DECEASED">DECEASED</option>
                        <option value="ON_LEAVE">ON LEAVE</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Commissioned</label>
                    <input type="date" value={editFormData.date_commissioned} onChange={(e) => setEditFormData({...editFormData, date_commissioned: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                  </div>
                </div>

                <div className="pt-4 mt-4 flex justify-end gap-3 border-t">
                  <button onClick={() => setEditingOfficer(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
                  <button onClick={handleUpdateOfficer} disabled={updating} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50">
                    {updating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
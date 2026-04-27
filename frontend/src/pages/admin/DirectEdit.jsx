import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function DirectEdit() {
  const [selectedRank, setSelectedRank] = useState('2LT');
  const [officers, setOfficers] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState('assignment');
  const [formData, setFormData] = useState({});
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('last_name');
  const [sortOrder, setSortOrder] = useState('asc');

  const ranks = [
    { code: '2LT', label: 'O1', name: 'Second Lieutenant', color: 'bg-gray-600' },
    { code: '1LT', label: 'O2', name: 'First Lieutenant', color: 'bg-blue-600' },
    { code: 'CPT', label: 'O3', name: 'Captain', color: 'bg-green-600' },
    { code: 'MAJ', label: 'O4', name: 'Major', color: 'bg-purple-600' },
    { code: 'LTC', label: 'O5', name: 'Lieutenant Colonel', color: 'bg-yellow-600' },
  ];

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchOfficerRating = async (officerId) => {
    try {
      const response = await axios.get(`${API_BASE}/qualifications/ratings/?officer=${officerId}`, getAuthHeader());
      const ratings = response.data.results || [];
      const rating = ratings.find(r => r.rating_level === 'COMMAND' || r.rating_level === 'SENIOR' || r.rating_level === 'BASIC');
      return rating?.rating_level || null;
    } catch (error) {
      return null;
    }
  };

  const fetchOfficersByRank = async (rankCode) => {
    setLoading(true);
    try {
      let allOfficers = [];
      let nextUrl = `${API_BASE}/officers/officers/?rank=${rankCode}&page_size=100`;
      while (nextUrl) {
        const response = await axios.get(nextUrl, getAuthHeader());
        const officersWithRatings = await Promise.all(
          (response.data.results || []).map(async (officer) => {
            const rating = await fetchOfficerRating(officer.id);
            return { ...officer, rating };
          })
        );
        allOfficers = [...allOfficers, ...officersWithRatings];
        nextUrl = response.data.next;
      }
      setOfficers(allOfficers);
      setSelectedRank(rankCode);
      setExpandedOfficer(null);
      setCareerHistory({});
    } catch (error) {
      console.error(error);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerHistory = async (officerId) => {
    if (careerHistory[officerId]) {
      setExpandedOfficer(expandedOfficer === officerId ? null : officerId);
      return;
    }
    
    try {
      const response = await axios.get(`${API_BASE}/officers/officers/${officerId}/`, getAuthHeader());
      setCareerHistory(prev => ({ ...prev, [officerId]: response.data.career_history || [] }));
      setExpandedOfficer(officerId);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const unitsRes = await axios.get(`${API_BASE}/units/units/?page_size=1000`, getAuthHeader());
      setUnits(unitsRes.data.results || []);
      await fetchOfficersByRank(selectedRank);
    } catch (error) {
      console.error('API Error:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('⚠️ SUPER ADMIN: Are you sure you want to delete this? This action cannot be undone.')) return;
    
    try {
      let url = '';
      if (type === 'officer') url = `${API_BASE}/officers/officers/${id}/`;
      else if (type === 'assignment') url = `${API_BASE}/assignments/assignments/${id}/`;
      
      await axios.delete(url, getAuthHeader());
      if (type === 'officer') {
        await fetchOfficersByRank(selectedRank);
      } else {
        await fetchAllData();
      }
      alert('Deleted successfully');
    } catch (error) {
      alert('Error deleting: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleAddAssignment = (officerId) => {
    setModalType('assignment');
    setEditingItem(null);
    setFormData({
      officer: officerId,
      unit: '',
      position: '',
      date_assumed: new Date().toISOString().split('T')[0],
      date_relinquished: '',
      assignment_type: 'PERMANENT',
      remarks: ''
    });
    setShowModal(true);
  };

  const handleEditAssignment = (assignment) => {
    setModalType('assignment');
    setEditingItem(assignment);
    setFormData({
      officer: assignment.officer,
      unit: assignment.unit?.id || assignment.unit,
      position: assignment.position?.id || assignment.position,
      date_assumed: assignment.date_assumed?.split('T')[0] || '',
      date_relinquished: assignment.date_relinquished?.split('T')[0] || '',
      assignment_type: assignment.assignment_type || 'PERMANENT',
      remarks: assignment.remarks || ''
    });
    setShowModal(true);
  };

  const handleAddOfficer = () => {
    setModalType('officer');
    setEditingItem(null);
    setFormData({
      paf_number: '',
      rank: selectedRank,
      first_name: '',
      last_name: '',
      status: 'ACTIVE',
      date_commissioned: ''
    });
    setShowModal(true);
  };

  const handleEditOfficer = (officer) => {
    setModalType('officer');
    setEditingItem(officer);
    setFormData({ ...officer });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let url = '';
      let method = editingItem?.id ? 'put' : 'post';
      
      if (modalType === 'officer') {
        url = `${API_BASE}/officers/officers/${editingItem?.id || ''}`;
      } else if (modalType === 'assignment') {
        url = `${API_BASE}/assignments/assignments/${editingItem?.id || ''}`;
      }
      
      const submitData = { ...formData };
      if (submitData.date_relinquished === '') {
        submitData.date_relinquished = null;
      }
      
      if (method === 'put') {
        await axios.put(url, submitData, getAuthHeader());
      } else {
        await axios.post(url, submitData, getAuthHeader());
      }
      
      await fetchOfficersByRank(selectedRank);
      setShowModal(false);
      setEditingItem(null);
      alert('Saved successfully');
    } catch (error) {
      alert('Error saving: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getSortedOfficers = () => {
    let filtered = officers.filter(o =>
      `${o.first_name} ${o.last_name} ${o.paf_number}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.sort((a, b) => {
      let aVal, bVal;
      if (sortBy === 'last_name') {
        aVal = a.last_name;
        bVal = b.last_name;
      } else if (sortBy === 'first_name') {
        aVal = a.first_name;
        bVal = b.first_name;
      } else if (sortBy === 'flight_hours') {
        aVal = a.total_flight_hours || 0;
        bVal = b.total_flight_hours || 0;
      } else if (sortBy === 'paf_number') {
        aVal = a.paf_number || '';
        bVal = b.paf_number || '';
      } else if (sortBy === 'rating') {
        const ratingOrder = { 'COMMAND': 3, 'SENIOR': 2, 'BASIC': 1, null: 0 };
        aVal = ratingOrder[a.rating] || 0;
        bVal = ratingOrder[b.rating] || 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString();
  };

  const currentRank = ranks.find(r => r.code === selectedRank);
  const sortedOfficers = getSortedOfficers();

  useEffect(() => {
    fetchAllData();
  }, []);

  const getRatingBadge = (rating) => {
    if (rating === 'COMMAND') return 'bg-yellow-100 text-yellow-800';
    if (rating === 'SENIOR') return 'bg-blue-100 text-blue-800';
    if (rating === 'BASIC') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-50 text-gray-400';
  };

  return (
    <div>
      {/* Super Admin Header */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <h3 className="font-semibold text-yellow-800">Super Admin Mode</h3>
            <p className="text-sm text-yellow-700">You have full write access. Click on any officer to view/edit their career history.</p>
          </div>
        </div>
      </div>

      {/* Rank Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-600">FILTER BY RANK</h2>
          <button
            onClick={handleAddOfficer}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            + Add New Officer
          </button>
        </div>
        <div className="flex gap-3 flex-wrap">
          {ranks.map(rank => (
            <button
              key={rank.code}
              onClick={() => fetchOfficersByRank(rank.code)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                selectedRank === rank.code
                  ? `${rank.color} text-white shadow-lg`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div>{rank.label} - {rank.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-xl font-bold text-gray-800">{currentRank?.label}</span>
            <span className="text-gray-500 ml-2">Officers</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm ml-2">{sortedOfficers.length} total</span>
          </div>
          
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              placeholder="Search by name or PAF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="last_name">Sort by Last Name</option>
              <option value="first_name">Sort by First Name</option>
              <option value="flight_hours">Sort by Flight Hours</option>
              <option value="paf_number">Sort by PAF Number</option>
              <option value="rating">Sort by Rating</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </button>
          </div>
        </div>
      </div>

      {/* Officers List - Expandable */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-700">{selectedRank} OFFICERS - Click to expand and edit career history</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading officers...</div>
        ) : sortedOfficers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found for this rank</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedOfficers.map((officer, idx) => (
              <div key={officer.id} className="hover:bg-gray-50">
                {/* Officer Row - Click to expand */}
                <div 
                  className="px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => fetchOfficerHistory(officer.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-400 w-8">{idx + 1}</span>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${currentRank.color}`}>
                        {officer.rank}
                      </span>
                    </div>
                    <div className="w-32">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRatingBadge(officer.rating)}`}>
                        {officer.rating || 'N/A'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{officer.first_name} {officer.last_name}</span>
                      <span className="text-gray-400 text-xs ml-2">({officer.paf_number})</span>
                    </div>
                    <div className="w-28 text-right">
                      <span className="text-emerald-600 font-semibold">{Math.round(officer.total_flight_hours || 0)} hrs</span>
                    </div>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs ${officer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {officer.status}
                      </span>
                    </div>
                    <div className="w-8 text-gray-400">
                      {expandedOfficer === officer.id ? '▼' : '▶'}
                    </div>
                  </div>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEditOfficer(officer)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(officer.id, 'officer')}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expanded Career History Section */}
                {expandedOfficer === officer.id && (
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-sm text-gray-700">Career History</h4>
                      <button
                        onClick={() => handleAddAssignment(officer.id)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                      >
                        + Add Assignment
                      </button>
                    </div>
                    
                    {!careerHistory[officer.id] || careerHistory[officer.id].length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No career history available. Click "Add Assignment" to add.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr className="border-b">
                              <th className="px-3 py-2 text-left">From</th>
                              <th className="px-3 py-2 text-left">To</th>
                              <th className="px-3 py-2 text-left">Unit</th>
                              <th className="px-3 py-2 text-left">Position</th>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-left">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {careerHistory[officer.id].map((history, hidx) => (
                              <tr key={hidx} className="border-b border-gray-200 hover:bg-gray-100">
                                <td className="px-3 py-2">{formatDate(history.date_assumed)}</td>
                                <td className="px-3 py-2">{formatDate(history.date_relinquished)}</td>
                                <td className="px-3 py-2">{history.unit?.unit_code || '-'}</td>
                                <td className="px-3 py-2 max-w-md truncate">{history.position?.position_title || '-'}</td>
                                <td className="px-3 py-2">{history.assignment_type || 'PERMANENT'}</td>
                                <td className="px-3 py-2">
                                  <button
                                    onClick={() => handleEditAssignment(history)}
                                    className="text-blue-600 hover:text-blue-800 mr-2"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(history.id, 'assignment')}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total {selectedRank}</p>
          <p className="text-2xl font-bold">{sortedOfficers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Active Officers</p>
          <p className="text-2xl font-bold">{sortedOfficers.filter(o => o.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Flight Hours</p>
          <p className="text-2xl font-bold">{sortedOfficers.reduce((sum, o) => sum + (o.total_flight_hours || 0), 0).toLocaleString()} hrs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Flight Hours</p>
          <p className="text-2xl font-bold">{sortedOfficers.length > 0 ? Math.round(sortedOfficers.reduce((sum, o) => sum + (o.total_flight_hours || 0), 0) / sortedOfficers.length).toLocaleString() : 0} hrs</p>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">
                {editingItem ? 'Edit' : 'Add'} {modalType === 'officer' ? 'Officer' : 'Assignment'}
              </h3>
              <form onSubmit={handleSubmit}>
                {modalType === 'officer' && (
                  <div className="space-y-3">
                    <input type="text" placeholder="PAF Number (O-XXXXX)" value={formData.paf_number || ''} onChange={(e) => setFormData({...formData, paf_number: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    <select value={formData.rank || selectedRank} onChange={(e) => setFormData({...formData, rank: e.target.value})} className="w-full px-3 py-2 border rounded">
                      {ranks.map(r => <option key={r.code} value={r.code}>{r.label} - {r.name}</option>)}
                    </select>
                    <input type="text" placeholder="First Name" value={formData.first_name || ''} onChange={(e) => setFormData({...formData, first_name: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                    <input type="text" placeholder="Last Name" value={formData.last_name || ''} onChange={(e) => setFormData({...formData, last_name: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                    <select value={formData.status || 'ACTIVE'} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded">
                      <option value="ACTIVE">Active</option>
                      <option value="RETIRED">Retired</option>
                      <option value="DECEASED">Deceased</option>
                    </select>
                    <input type="date" value={formData.date_commissioned || ''} onChange={(e) => setFormData({...formData, date_commissioned: e.target.value})} className="w-full px-3 py-2 border rounded" />
                  </div>
                )}
                {modalType === 'assignment' && (
                  <div className="space-y-3">
                    <select value={formData.unit || ''} onChange={(e) => setFormData({...formData, unit: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded" required>
                      <option value="">Select Unit</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.unit_code}</option>)}
                    </select>
                    <input type="text" placeholder="Position Title" value={formData.position || ''} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-3 py-2 border rounded" />
                    <input type="date" value={formData.date_assumed || ''} onChange={(e) => setFormData({...formData, date_assumed: e.target.value})} className="w-full px-3 py-2 border rounded" required />
                    <input type="date" value={formData.date_relinquished || ''} onChange={(e) => setFormData({...formData, date_relinquished: e.target.value || null})} className="w-full px-3 py-2 border rounded" />
                    <select value={formData.assignment_type || 'PERMANENT'} onChange={(e) => setFormData({...formData, assignment_type: e.target.value})} className="w-full px-3 py-2 border rounded">
                      <option value="PERMANENT">Permanent</option>
                      <option value="ACTING">Acting</option>
                      <option value="TEMPORARY">Temporary</option>
                      <option value="DETAILED">Detailed</option>
                    </select>
                    <textarea placeholder="Remarks" value={formData.remarks || ''} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border rounded" rows="2" />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DirectEdit;
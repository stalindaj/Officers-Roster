import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function RankOfficers() {
  const { rankLevel } = useParams();
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const rankMapping = {
    'O1': '2LT',
    'O2': '1LT',
    'O3': 'CPT',
    'O4': 'MAJ',
    'O5': 'LTC'
  };

  const rankCode = rankMapping[rankLevel];
  const rankTitle = `${rankLevel} (${rankCode}) Officers`;

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchOfficersByRank = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE}/officers/officers/?rank=${rankCode}&page_size=100`;
      const response = await axios.get(url, getAuthHeader());
      
      // API returns array directly
      if (Array.isArray(response.data)) {
        setOfficers(response.data);
      } else if (response.data.results) {
        setOfficers(response.data.results);
      } else {
        setOfficers([]);
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficerDetails = async (officerId) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE}/officers/officers/${officerId}/`, getAuthHeader());
      setCareerHistory(response.data.career_history || []);
      setSelectedOfficer(response.data);
    } catch (error) {
      console.error('Error fetching officer details:', error);
      setCareerHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOfficersByRank();
  }, [rankLevel]);

  const formatFlyingHours = (h) => h ? Math.round(h).toLocaleString() : '0';
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  };

  const getRankBadge = (rank) => {
    const colors = { LTC: 'bg-yellow-600', MAJ: 'bg-purple-600', CPT: 'bg-green-600', '1LT': 'bg-blue-600', '2LT': 'bg-gray-600' };
    return colors[rank] || 'bg-gray-400';
  };

  const filteredOfficers = officers.filter(officer =>
    `${officer.first_name} ${officer.last_name} ${officer.paf_number}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{rankTitle}</h1>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{officers.length} officers</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Officers</p>
          <p className="text-2xl font-bold">{officers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-600">{officers.filter(o => o.status === 'ACTIVE').length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Total Flight Hours</p>
          <p className="text-2xl font-bold text-emerald-600">{officers.reduce((sum, o) => sum + (o.total_flight_hours || 0), 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-500 text-sm">Avg Flight Hours</p>
          <p className="text-2xl font-bold">{Math.round(officers.reduce((sum, o) => sum + (o.total_flight_hours || 0), 0) / (officers.length || 1)).toLocaleString()}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <input
          type="text"
          placeholder="Search by name or PAF number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Officers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h2 className="font-semibold text-gray-700">{rankTitle}</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading officers...</div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found for {rankCode}</div>
        ) : (
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
                {filteredOfficers.map((officer, idx) => (
                  <tr key={officer.id} className="hover:bg-gray-50 border-b">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">{officer.paf_number || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getRankBadge(officer.rank)}`}>
                        {officer.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">{officer.first_name} {officer.last_name}</td>
                    <td className="px-4 py-3">{officer.status}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{formatFlyingHours(officer.total_flight_hours)} hrs</td>
                    <td className="px-4 py-3">{officer.current_assignment?.unit?.unit_code || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => fetchOfficerDetails(officer.id)} 
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Officer Detail Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOfficer(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {selectedOfficer.rank} {selectedOfficer.first_name} {selectedOfficer.last_name}
                    </h3>
                    <p className="text-blue-200 text-sm mt-1">{selectedOfficer.paf_number}</p>
                  </div>
                  <button onClick={() => setSelectedOfficer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>
              </div>

              <div className="p-6">
                {/* Basic Info */}
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

                {/* Current Assignment */}
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

                {/* Career History */}
                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Career History ({careerHistory.length} assignments)</h4>
                  {loadingHistory ? (
                    <div className="text-center py-10">Loading career history...</div>
                  ) : careerHistory.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">No career history available</div>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
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
                              <td className="px-3 py-2 whitespace-nowrap">{formatDate(history.date_assumed)}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{formatDate(history.date_relinquished)}</td>
                              <td className="px-3 py-2">{history.unit?.unit_code || 'N/A'}</td>
                              <td className="px-3 py-2 max-w-xs truncate">{history.position?.position_title || 'N/A'}</td>
                              <td className="px-3 py-2">{history.assignment_type || 'PERMANENT'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-lg flex justify-end">
                <button onClick={() => setSelectedOfficer(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RankOfficers;
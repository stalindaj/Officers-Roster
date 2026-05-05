import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function RankOfficers() {
  const { rankLevel } = useParams();
  const navigate = useNavigate();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState([]);

  const rankMapping = {
    'O1': '2LT',
    'O2': '1LT',
    'O3': 'CPT',
    'O4': 'MAJ',
    'O5': 'LTC'
  };

  const rankCode = rankMapping[rankLevel];
  const rankTitle = `${rankLevel} (${rankCode}) Officers`;

  const fetchOfficers = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('access_token');
    console.log('1. Token from storage:', token ? `${token.substring(0, 50)}...` : 'NO TOKEN');
    
    try {
      // Method 1: Direct axios with headers object
      const url = `${API_BASE}/officers/officers/?rank=${rankCode}&page_size=100`;
      console.log('2. Request URL:', url);
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('3. Response status:', response.status);
      console.log('4. Response data:', response.data);
      
      const officersData = response.data.results || response.data;
      setOfficers(Array.isArray(officersData) ? officersData : []);
    } catch (error) {
      console.error('ERROR FULL:', error);
      console.error('ERROR RESPONSE:', error.response);
      console.error('ERROR STATUS:', error.response?.status);
      console.error('ERROR DATA:', error.response?.data);
      setError(`Error: ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [rankLevel]);

  const formatFlyingHours = (h) => h ? Math.round(h).toLocaleString() : '0';
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const parts = dateString.split('-');
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
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
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{rankTitle}</h1>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">{officers.length} officers</span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => fetchOfficers()} 
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      )}

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
          <h2 className="font-semibold text-gray-700">Officer List - Click on any row to view career history</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading officers...</div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found for {rankCode}</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOfficers.map((officer, idx) => (
              <div 
                key={officer.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedOfficer(officer);
                  setCareerHistory(officer.career_history || []);
                }}
              >
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-10 text-gray-400">{idx + 1}</div>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getRankBadge(officer.rank)}`}>
                        {officer.rank}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{officer.first_name} {officer.last_name}</div>
                      <div className="text-xs text-gray-400">{officer.paf_number}</div>
                    </div>
                    <div className="w-32 text-right">
                      <span className="text-emerald-600 font-semibold">{formatFlyingHours(officer.total_flight_hours)} hrs</span>
                    </div>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs ${officer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {officer.status}
                      </span>
                    </div>
                    <div className="w-8 text-gray-400">→</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal - simplified for now */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50"></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {selectedOfficer.rank} {selectedOfficer.first_name} {selectedOfficer.last_name}
                </h3>
                <button onClick={() => setSelectedOfficer(null)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <div className="space-y-2">
                <p><strong>PAF Number:</strong> {selectedOfficer.paf_number}</p>
                <p><strong>Status:</strong> {selectedOfficer.status}</p>
                <p><strong>Flight Hours:</strong> {formatFlyingHours(selectedOfficer.total_flight_hours)} hrs</p>
                {selectedOfficer.current_assignment && (
                  <p><strong>Current Unit:</strong> {selectedOfficer.current_assignment.unit?.unit_code || 'N/A'}</p>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedOfficer(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
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
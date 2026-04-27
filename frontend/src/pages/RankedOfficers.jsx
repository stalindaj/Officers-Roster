import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function RankedOfficers() {
  const [selectedRank, setSelectedRank] = useState('2LT');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState('last_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState({});

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

  const fetchOfficersByRank = async (rankCode) => {
    setLoading(true);
    try {
      // Fetch all officers of this rank (handle pagination)
      let allOfficers = [];
      let nextUrl = `${API_BASE}/officers/officers/?rank=${rankCode}&page_size=100`;
      while (nextUrl) {
        const response = await axios.get(nextUrl, getAuthHeader());
        allOfficers = [...allOfficers, ...(response.data.results || [])];
        nextUrl = response.data.next;
      }
      setOfficers(allOfficers);
      setSelectedRank(rankCode);
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

  useEffect(() => {
    fetchOfficersByRank('2LT');
  }, []);

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
    const d = new Date(dateString);
    return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const sortedOfficers = getSortedOfficers();
  const currentRank = ranks.find(r => r.code === selectedRank);

  return (
    <div className="p-6">
      {/* Rank Buttons */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">FILTER BY RANK</h2>
        <div className="flex gap-3 flex-wrap">
          {ranks.map(rank => (
            <button
              key={rank.code}
              onClick={() => fetchOfficersByRank(rank.code)}
              className={`px-5 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                selectedRank === rank.code
                  ? `${rank.color} text-white shadow-lg ring-2 ring-offset-2 ring-${rank.color.split('-')[1]}-300`
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <div className="text-lg">{rank.label}</div>
              <div className="text-xs opacity-80">{rank.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats and Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <span className="text-2xl font-bold text-gray-800">{currentRank?.label}</span>
            <span className="text-gray-500 ml-2">Officers</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm ml-2">{sortedOfficers.length} total</span>
          </div>
          
          <div className="flex gap-3">
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
              className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none"
            >
              <option value="last_name">Sort by Last Name</option>
              <option value="first_name">Sort by First Name</option>
              <option value="flight_hours">Sort by Flight Hours</option>
              <option value="paf_number">Sort by PAF Number</option>
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

      {/* Officers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-700">{selectedRank} OFFICERS LIST</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading officers...</div>
        ) : sortedOfficers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found for this rank</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PAF Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Flight Hours</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Current Unit</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedOfficers.map((officer, idx) => (
                  <React.Fragment key={officer.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => fetchOfficerHistory(officer.id)}>
                      <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs">{officer.paf_number || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${currentRank?.color}`}>
                          {officer.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{officer.first_name} {officer.last_name}</td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">
                        {Math.round(officer.total_flight_hours || 0).toLocaleString()} hrs
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {officer.current_assignment?.unit?.unit_code || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${officer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {officer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:text-blue-800 text-xs">
                          {expandedOfficer === officer.id ? '▼ Hide History' : '▶ View History'}
                        </button>
                      </td>
                     </tr>
                    
                    {/* Expanded Career History */}
                    {expandedOfficer === officer.id && careerHistory[officer.id] && (
                      <tr className="bg-gray-50">
                        <td colSpan="8" className="px-4 py-3">
                          <div className="border-t pt-3">
                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Career History</h4>
                            {careerHistory[officer.id].length === 0 ? (
                              <p className="text-gray-400 text-sm">No career history available</p>
                            ) : (
                              <table className="w-full text-xs">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-1 text-left">From</th>
                                    <th className="px-3 py-1 text-left">To</th>
                                    <th className="px-3 py-1 text-left">Unit</th>
                                    <th className="px-3 py-1 text-left">Position</th>
                                    <th className="px-3 py-1 text-left">Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {careerHistory[officer.id].map((hist, hidx) => (
                                    <tr key={hidx} className="border-b border-gray-200">
                                      <td className="px-3 py-1">{formatDate(hist.date_assumed)}</td>
                                      <td className="px-3 py-1">{formatDate(hist.date_relinquished)}</td>
                                      <td className="px-3 py-1">{hist.unit?.unit_code || '-'}</td>
                                      <td className="px-3 py-1 max-w-md">{hist.position?.position_title || '-'}</td>
                                      <td className="px-3 py-1">{hist.assignment_type || 'PERMANENT'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
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
          <p className="text-gray-500 text-sm">Average Hours</p>
          <p className="text-2xl font-bold">{sortedOfficers.length > 0 ? Math.round(sortedOfficers.reduce((sum, o) => sum + (o.total_flight_hours || 0), 0) / sortedOfficers.length).toLocaleString() : 0} hrs</p>
        </div>
      </div>
    </div>
  );
}

export default RankedOfficers;
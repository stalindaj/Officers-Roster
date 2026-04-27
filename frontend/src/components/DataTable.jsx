import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function DataTable() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState(null);

  const ranks = ['all', 'LTC', 'MAJ', 'CPT', '1LT', '2LT'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchAllOfficers = async () => {
    setLoading(true);
    try {
      let allResults = [];
      let nextUrl = `${API_BASE}/officers/officers/?page_size=100`;
      
      if (selectedRank !== 'all') {
        nextUrl += `&rank=${selectedRank}`;
      }
      
      while (nextUrl) {
        const response = await axios.get(nextUrl, getAuthHeader());
        allResults = [...allResults, ...(response.data.results || [])];
        nextUrl = response.data.next;
      }
      
      setOfficers(allResults);
    } catch (error) {
      console.error(error);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOfficers();
  }, [selectedRank]);

  const filteredOfficers = officers.filter(officer =>
    `${officer.first_name} ${officer.last_name} ${officer.paf_number} ${officer.rank}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const getRankBadge = (rank) => {
    const colors = {
      LTC: 'bg-yellow-600',
      MAJ: 'bg-purple-600',
      CPT: 'bg-green-600',
      '1LT': 'bg-blue-600',
      '2LT': 'bg-gray-600',
    };
    return colors[rank] || 'bg-gray-400';
  };

  const getStatusBadge = (status) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Officers Data Table</h1>
          <p className="text-sm text-gray-500 mt-1">Complete officer data imported from Excel</p>
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
          <div>
            <input
              type="text"
              placeholder="Search by name, rank, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm w-80 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PAF Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">First Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Last Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Flight Hours</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Current Unit</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Start Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOfficers.map((officer, idx) => (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{officer.paf_number || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getRankBadge(officer.rank)}`}>
                        {officer.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{officer.first_name}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{officer.last_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(officer.status)}`}>
                        {officer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">
                      {Math.round(officer.total_flight_hours || 0).toLocaleString()} hrs
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {officer.current_assignment?.unit?.unit_code || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(officer.current_assignment?.date_assumed)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedOfficer(officer)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t bg-gray-50">
          <span className="text-sm text-gray-600">
            Showing {filteredOfficers.length} of {officers.length} officers
          </span>
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

      {/* Officer Details Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={() => setSelectedOfficer(null)}></div>
            
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto z-10" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {selectedOfficer.rank} {selectedOfficer.first_name} {selectedOfficer.last_name}
                  </h3>
                  <button onClick={() => setSelectedOfficer(null)} className="text-white hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-blue-200 text-sm mt-1">{selectedOfficer.paf_number}</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
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

                {selectedOfficer.current_assignment && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Current Assignment</h4>
                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Assignment Type</p>
                        <p className="font-semibold">{selectedOfficer.current_assignment.assignment_type}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">Career History</h4>
                  <div className="max-h-64 overflow-y-auto">
                    {selectedOfficer.career_history?.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left">Unit</th>
                            <th className="px-3 py-2 text-left">Position</th>
                            <th className="px-3 py-2 text-left">From</th>
                            <th className="px-3 py-2 text-left">To</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOfficer.career_history?.map((history, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2">{history.unit?.unit_code || 'N/A'}</td>
                              <td className="px-3 py-2 text-xs">{history.position?.position_title || 'N/A'}</td>
                              <td className="px-3 py-2">{formatDate(history.date_assumed)}</td>
                              <td className="px-3 py-2">{formatDate(history.date_relinquished) || 'Present'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No career history available</p>
                    )}
                  </div>
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

export default DataTable;
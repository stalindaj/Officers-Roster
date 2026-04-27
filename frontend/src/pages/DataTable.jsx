import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function DataTable() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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
      if (selectedRank !== 'all') nextUrl += `&rank=${selectedRank}`;
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

  const fetchOfficerDetails = async (officerId) => {
    setLoadingHistory(true);
    try {
      const response = await axios.get(`${API_BASE}/officers/officers/${officerId}/`, getAuthHeader());
      setCareerHistory(response.data.career_history || []);
    } catch (error) {
      console.error(error);
      setCareerHistory([]);
    } finally {
      setLoadingHistory(false);
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
    // Handle YYYY-MM-DD format from database
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return dateString;
  };

  const handleViewDetails = (officer) => {
    setSelectedOfficer(officer);
    fetchOfficerDetails(officer.id);
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Officers Data Table</h1>
        </div>
        <div className="px-6 py-4 border-b flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            {ranks.map(rank => (<button key={rank} onClick={() => setSelectedRank(rank)} className={`px-3 py-1 text-sm rounded ${selectedRank === rank ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{rank === 'all' ? 'All' : rank}</button>))}
          </div>
          <input type="text" placeholder="Search by name, rank, or PAF..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm w-80" />
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
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs text-white ${getRankBadge(o.rank)}`}>{o.rank}</span></td>
                    <td className="px-4 py-3">{o.first_name} {o.last_name}</td>
                    <td className="px-4 py-3">{o.status}</td>
                    <td className="px-4 py-3 text-emerald-600 font-semibold">{Math.round(o.total_flight_hours || 0).toLocaleString()} hrs</td>
                    <td className="px-4 py-3">{o.current_assignment?.unit?.unit_code || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleViewDetails(o)} className="text-blue-600 hover:text-blue-800 text-sm">View History</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-6 py-3 border-t bg-gray-50"><span className="text-sm text-gray-600">Showing {filteredOfficers.length} of {officers.length} officers</span></div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Total Officers</p><p className="text-2xl font-bold">{officers.length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">Active Officers</p><p className="text-2xl font-bold">{officers.filter(o => o.status === 'ACTIVE').length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">With Flight Hours</p><p className="text-2xl font-bold">{officers.filter(o => o.total_flight_hours > 0).length}</p></div>
        <div className="bg-white rounded-lg shadow p-4"><p className="text-gray-500 text-sm">With Current Assignment</p><p className="text-2xl font-bold">{officers.filter(o => o.current_assignment).length}</p></div>
      </div>

      {/* Career History Modal */}
      {selectedOfficer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedOfficer(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOfficer(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {selectedOfficer.rank} {selectedOfficer.first_name} {selectedOfficer.last_name}
                  </h3>
                  <button onClick={() => setSelectedOfficer(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                </div>
                <p className="text-blue-200 text-sm mt-1">{selectedOfficer.paf_number}</p>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                              <td className="px-3 py-2"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{history.assignment_type || 'PERMANENT'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                       </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-3 rounded-b-lg flex justify-end">
                <button onClick={() => setSelectedOfficer(null)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
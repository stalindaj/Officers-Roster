import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function DataTable() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const ranks = ['all', 'LTC', 'MAJ', 'CPT', '1LT', '2LT'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/officers/officers/?page=${currentPage}&page_size=50`;
      if (selectedRank !== 'all') {
        url += `&rank=${selectedRank}`;
      }
      const response = await axios.get(url, getAuthHeader());
      setOfficers(response.data.results || []);
      setTotalPages(Math.ceil(response.data.count / 50) || 1);
    } catch (error) {
      console.error(error);
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [selectedRank, currentPage]);

  const filteredOfficers = officers.filter(officer =>
    `${officer.first_name} ${officer.last_name} ${officer.paf_number}`
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

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <h1 className="text-xl font-bold text-gray-800">Officers Data Table</h1>
          <p className="text-sm text-gray-500 mt-1">Verify all officer data imported from Excel</p>
        </div>

        {/* Filters */}
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
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">PAF Number</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">First Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Last Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Flight Hours</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Current Unit</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Current Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOfficers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{officer.id}</td>
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
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {officer.current_assignment?.position?.position_title || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-3 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {filteredOfficers.length} of {officers.length} officers
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
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
    </div>
  );
}

export default DataTable;
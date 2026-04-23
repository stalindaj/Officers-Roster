import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function Dashboard() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRank, setSelectedRank] = useState('all');

  const ranks = [
    { code: 'all', name: 'All' },
    { code: 'LTC', name: 'LTC' },
    { code: 'MAJ', name: 'MAJ' },
    { code: 'CPT', name: 'CPT' },
    { code: '1LT', name: '1LT' },
    { code: '2LT', name: '2LT' },
  ];

  const fetchOfficers = async () => {
    setLoading(true);
    try {
      const url = selectedRank === 'all' 
        ? `${API_BASE}/officers/officers/`
        : `${API_BASE}/officers/officers/?rank=${selectedRank}`;
      
      const response = await axios.get(url);
      setOfficers(response.data.results || []);
    } catch (error) {
      console.error('Error fetching officers:', error);
      if (error.response?.status === 401) {
        // Redirect to login
        window.location.reload();
      }
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficers();
  }, [selectedRank]);

  const getRankBadge = (rank) => {
    const colors = {
      LTC: 'bg-amber-500',
      MAJ: 'bg-purple-500',
      CPT: 'bg-green-500',
      '1LT': 'bg-blue-500',
      '2LT': 'bg-gray-500',
    };
    return colors[rank] || 'bg-gray-400';
  };

  const stats = [
    { label: 'Officers', value: officers.length, color: 'bg-blue-500' },
    { label: 'Active', value: officers.filter(o => o.status === 'ACTIVE').length, color: 'bg-green-500' },
    { label: 'Units', value: 11, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-3 border border-gray-100">
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className="text-xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-3 mb-4">
        <div className="flex flex-wrap gap-1">
          {ranks.map((r) => (
            <button
              key={r.code}
              onClick={() => setSelectedRank(r.code)}
              className={`px-3 py-1 text-sm rounded-md transition ${selectedRank === r.code ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Officers List</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : officers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No officers found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rank</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hours</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{o.first_name} {o.last_name}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs text-white ${getRankBadge(o.rank)}`}>
                        {o.rank}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-emerald-600 font-medium">{Math.round(o.total_flight_hours || 0)}</td>
                    <td className="px-4 py-2 text-gray-500">{o.current_assignment?.unit?.unit_code || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
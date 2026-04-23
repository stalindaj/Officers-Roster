import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function FlowchartDashboard() {
  const [selectedNode, setSelectedNode] = useState('2LT');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Get token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchOfficersByRank = async (rankCode) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/officers/officers/?rank=${rankCode}`, getAuthHeader());
      setOfficers(response.data.results || []);
      setSelectedNode(rankCode);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('access_token');
        window.location.reload();
      }
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOfficersByRole = async (role) => {
    setLoading(true);
    try {
      let rankCodes = [];
      switch(role) {
        case 'COPILOT': rankCodes = ['1LT', '2LT']; break;
        case 'WM': rankCodes = ['1LT', '2LT']; break;
        case 'EL': rankCodes = ['CPT']; break;
        case 'MTP': rankCodes = ['MAJ']; break;
        case 'IP': rankCodes = ['MAJ']; break;
        case 'FC': rankCodes = ['MAJ']; break;
        case 'FE': rankCodes = ['LTC']; break;
        default: rankCodes = [];
      }

      const results = await Promise.all(
        rankCodes.map(r =>
          axios.get(`${API_BASE}/officers/officers/?rank=${r}`, getAuthHeader())
            .then(res => res.data.results || [])
        )
      );

      let all = results.flat();
      setOfficers(all);
      setSelectedNode(role);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.removeItem('access_token');
        window.location.reload();
      }
      setOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFlyingHours = (h) => h ? Math.round(h).toLocaleString() : '0';

  useEffect(() => {
    fetchOfficersByRank('2LT');
  }, []);

  const ranks = [
    { code: '2LT', label: 'O1', name: '2nd Lieutenant' },
    { code: '1LT', label: 'O2', name: '1st Lieutenant' },
    { code: 'CPT', label: 'O3', name: 'Captain' },
    { code: 'MAJ', label: 'O4', name: 'Major' },
    { code: 'LTC', label: 'O5', name: 'Lt Colonel' },
  ];

  return (
    <div className="p-6">
      {/* Rank Row */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {ranks.map((rank) => (
          <div key={rank.code} className="flex justify-center">
            <button
              onClick={() => fetchOfficersByRank(rank.code)}
              onMouseEnter={() => setHoveredNode(rank.code)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`
                w-28 h-20 rounded-xl font-bold text-xl text-white transition-all duration-200
                ${selectedNode === rank.code ? 'bg-blue-700 ring-4 ring-blue-300 scale-105' : 'bg-blue-500'}
                ${hoveredNode === rank.code ? 'scale-105' : 'scale-100'}
              `}
            >
              <div>{rank.label}</div>
              <div className="text-xs font-normal opacity-80">{rank.name}</div>
            </button>
          </div>
        ))}
      </div>

      {/* Vertical Lines */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-center">
            <div className="h-10 border-l-2 border-dashed border-gray-400"></div>
          </div>
        ))}
      </div>

      {/* Flowchart Grid - Row 1 */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        <div></div><div></div><div></div>
        <div className="flex justify-center">
          <button
            onClick={() => fetchOfficersByRole('MTP')}
            onMouseEnter={() => setHoveredNode('MTP')}
            onMouseLeave={() => setHoveredNode(null)}
            className={`
              px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200
              ${selectedNode === 'MTP' ? 'bg-green-700 ring-4 ring-green-300' : 'bg-green-500'}
              ${hoveredNode === 'MTP' ? 'translate-y-[-3px]' : 'translate-y-0'}
            `}
          >
            MTP
          </button>
        </div>
        <div></div>
      </div>

      {/* Flowchart Grid - Row 2 */}
      <div className="grid grid-cols-5 gap-6 mb-8">
        {['COPILOT', 'WM', 'EL', 'IP', 'FE'].map((role) => (
          <div key={role} className="flex justify-center">
            <button
              onClick={() => fetchOfficersByRole(role)}
              onMouseEnter={() => setHoveredNode(role)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`
                px-5 py-2 rounded-lg font-semibold text-white transition-all duration-200
                ${selectedNode === role ? 'bg-green-700 ring-4 ring-green-300' : 'bg-green-500'}
                ${hoveredNode === role ? 'translate-y-[-3px]' : 'translate-y-0'}
              `}
            >
              {role === 'COPILOT' ? 'CO-PILOT' : role}
            </button>
          </div>
        ))}
      </div>

      {/* Flowchart Grid - Row 3 */}
      <div className="grid grid-cols-5 gap-6">
        <div></div><div></div><div></div>
        <div className="flex justify-center">
          <button
            onClick={() => fetchOfficersByRole('FC')}
            onMouseEnter={() => setHoveredNode('FC')}
            onMouseLeave={() => setHoveredNode(null)}
            className={`
              px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200
              ${selectedNode === 'FC' ? 'bg-green-700 ring-4 ring-green-300' : 'bg-green-500'}
              ${hoveredNode === 'FC' ? 'translate-y-[-3px]' : 'translate-y-0'}
            `}
          >
            FC
          </button>
        </div>
        <div></div>
      </div>

      {/* Officers Table */}
      <div className="mt-12">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h2 className="font-semibold text-gray-700">
              {selectedNode} OFFICERS ({officers.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-10">Loading...</div>
          ) : officers.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No officers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Rank</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Flight Hours</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Current Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {officers.map((officer) => (
                    <tr key={officer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">
                        {officer.rank} {officer.first_name} {officer.last_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-semibold text-white
                          ${officer.rank === 'LTC' ? 'bg-yellow-600' : ''}
                          ${officer.rank === 'MAJ' ? 'bg-purple-600' : ''}
                          ${officer.rank === 'CPT' ? 'bg-green-600' : ''}
                          ${officer.rank === '1LT' ? 'bg-blue-600' : ''}
                          ${officer.rank === '2LT' ? 'bg-gray-600' : ''}
                        `}>
                          {officer.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-semibold">
                        {formatFlyingHours(officer.total_flight_hours)} hrs
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {officer.current_assignment?.unit?.unit_code || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlowchartDashboard;
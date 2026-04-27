import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function FlowchartDashboard() {
  const [selectedNode, setSelectedNode] = useState('2LT');
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [expandedOfficer, setExpandedOfficer] = useState(null);
  const [careerHistory, setCareerHistory] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchOfficersByRank = async (rankCode) => {
    setLoading(true);
    try {
      let allOfficers = [];
      let nextUrl = `${API_BASE}/officers/officers/?rank=${rankCode}&page_size=100`;
      while (nextUrl) {
        const response = await axios.get(nextUrl, getAuthHeader());
        allOfficers = [...allOfficers, ...(response.data.results || [])];
        nextUrl = response.data.next;
      }
      setOfficers(allOfficers);
      setSelectedNode(rankCode);
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

  const formatFlyingHours = (h) => h ? Math.round(h).toLocaleString() : '0';
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    return new Date(dateString).toLocaleDateString();
  };

  useEffect(() => {
    fetchOfficersByRank('2LT');
  }, []);

  const ranks = [
    { code: '2LT', label: 'O1', name: '2nd Lieutenant', color: 'bg-gray-600' },
    { code: '1LT', label: 'O2', name: '1st Lieutenant', color: 'bg-blue-600' },
    { code: 'CPT', label: 'O3', name: 'Captain', color: 'bg-green-600' },
    { code: 'MAJ', label: 'O4', name: 'Major', color: 'bg-purple-600' },
    { code: 'LTC', label: 'O5', name: 'Lt Colonel', color: 'bg-yellow-600' },
  ];

  const getRankColor = (rankCode) => {
    const rank = ranks.find(r => r.code === rankCode);
    return rank?.color || 'bg-gray-600';
  };

  const getRatingBadge = (rating) => {
    if (rating === 'COMMAND') return 'bg-yellow-100 text-yellow-800';
    if (rating === 'SENIOR') return 'bg-blue-100 text-blue-800';
    if (rating === 'BASIC') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-500';
  };

  const filteredOfficers = officers.filter(o =>
    `${o.first_name} ${o.last_name} ${o.paf_number}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentRank = ranks.find(r => r.code === selectedNode);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">15SW Pilot Career Progression Flowchart</h2>
      
      {/* Rank Row - O1 to O5 with Arrows */}
      <div className="relative mb-8">
        <div className="grid grid-cols-5 gap-2">
          {ranks.map((rank, idx) => (
            <div key={rank.code} className="flex flex-col items-center">
              <button
                onClick={() => fetchOfficersByRank(rank.code)}
                onMouseEnter={() => setHoveredNode(rank.code)}
                onMouseLeave={() => setHoveredNode(null)}
                className={`w-28 h-20 rounded-xl font-bold text-xl text-white transition-all duration-200 shadow-md ${selectedNode === rank.code ? `${rank.color} ring-4 ring-blue-300 scale-105` : rank.color} ${hoveredNode === rank.code ? 'scale-105' : 'scale-100'}`}
              >
                <div>{rank.label}</div>
                <div className="text-xs font-normal opacity-80">{rank.name}</div>
              </button>
              {/* Arrow pointing down */}
              <div className="text-2xl text-gray-400 mt-2">↓</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role Buttons Row */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">CO-PILOT</button>
        </div>
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">WM</button>
        </div>
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">EL</button>
        </div>
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">IP</button>
        </div>
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">FE</button>
        </div>
      </div>

      {/* Diagonal Arrows Row */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div className="flex justify-center text-2xl text-gray-400">↘</div>
        <div></div>
        <div></div>
        <div className="flex justify-center text-2xl text-gray-400">↙</div>
        <div className="flex justify-center text-2xl text-gray-400">↙</div>
      </div>

      {/* MTP and FC Row */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <div></div>
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="text-2xl text-gray-400 mb-1">↑</div>
            <button className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">MTP</button>
          </div>
        </div>
        <div></div>
        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="text-2xl text-gray-400 mb-1">↑</div>
            <button className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md w-32">FC</button>
          </div>
        </div>
        <div></div>
      </div>

      {/* Legend */}
      <div className="mt-6 p-3 bg-gray-100 rounded-lg text-sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-600 rounded-full"></span><span>O1-O2: CO-PILOT / WM</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-600 rounded-full"></span><span>O3: EL</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-purple-600 rounded-full"></span><span>O4: MTP / IP / FC</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-600 rounded-full"></span><span>O5: FE</span></div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6 bg-white rounded-lg shadow p-3">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <span className="text-lg font-semibold text-gray-700">{selectedNode} Officers</span>
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm ml-2">{filteredOfficers.length} total</span>
          </div>
          <input
            type="text"
            placeholder="Search by name or PAF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Officers Table with Expandable History */}
      <div className="mt-4 bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-700">{selectedNode} OFFICERS - Click on any row to view career history</h2>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found</div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOfficers.map((officer, idx) => (
              <div key={officer.id} className="hover:bg-gray-50">
                {/* Officer Row - Click to expand */}
                <div 
                  className="px-4 py-3 flex items-center justify-between cursor-pointer"
                  onClick={() => fetchOfficerHistory(officer.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-400 w-8">{idx + 1}</span>
                    <div className="w-20">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${getRankColor(officer.rank)}`}>
                        {officer.rank}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{officer.first_name} {officer.last_name}</span>
                      <span className="text-gray-400 text-xs ml-2">({officer.paf_number})</span>
                    </div>
                    <div className="w-28 text-right">
                      <span className="text-emerald-600 font-semibold">{formatFlyingHours(officer.total_flight_hours)} hrs</span>
                    </div>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRatingBadge(officer.rating)}`}>
                        {officer.rating || 'N/A'}
                      </span>
                    </div>
                    <div className="w-24">
                      <span className={`px-2 py-1 rounded-full text-xs ${officer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {officer.status}
                      </span>
                    </div>
                    <div className="w-8 text-gray-400">
                      {expandedOfficer === officer.id ? '▲' : '▼'}
                    </div>
                  </div>
                </div>

                {/* Expanded Career History - Dropdown */}
                {expandedOfficer === officer.id && careerHistory[officer.id] && (
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Career History</h4>
                    {careerHistory[officer.id].length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No career history available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-200">
                            <tr>
                              <th className="px-3 py-2 text-left">From</th>
                              <th className="px-3 py-2 text-left">To</th>
                              <th className="px-3 py-2 text-left">Unit</th>
                              <th className="px-3 py-2 text-left">Position</th>
                              <th className="px-3 py-2 text-left">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {careerHistory[officer.id].map((history, hidx) => (
                              <tr key={hidx} className="border-b border-gray-200">
                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(history.date_assumed)}</td>
                                <td className="px-3 py-2 whitespace-nowrap">{formatDate(history.date_relinquished)}</td>
                                <td className="px-3 py-2">{history.unit?.unit_code || '-'}</td>
                                <td className="px-3 py-2 max-w-md">{history.position?.position_title || '-'}</td>
                                <td className="px-3 py-2">{history.assignment_type || 'PERMANENT'}</td>
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
    </div>
  );
}

export default FlowchartDashboard;
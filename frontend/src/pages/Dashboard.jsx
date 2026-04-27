import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function Dashboard() {
  const [selectedNode, setSelectedNode] = useState('O1');
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

  const getRankCodeFromO = (oLevel) => {
    const mapping = { 'O1': '2LT', 'O2': '1LT', 'O3': 'CPT', 'O4': 'MAJ', 'O5': 'LTC' };
    return mapping[oLevel];
  };

  const fetchOfficersByRank = async (oLevel) => {
    const rankCode = getRankCodeFromO(oLevel);
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
      setSelectedNode(oLevel);
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
    fetchOfficersByRank('O1');
  }, []);

  const oLevels = ['O1', 'O2', 'O3', 'O4', 'O5'];

  const getRankColor = (rankCode) => {
    const colors = { '2LT': 'bg-gray-600', '1LT': 'bg-blue-600', 'CPT': 'bg-green-600', 'MAJ': 'bg-purple-600', 'LTC': 'bg-yellow-600' };
    return colors[rankCode] || 'bg-gray-600';
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

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">15SW Pilot Career Progression Flowchart</h2>
      
      {/* Row 1: O1 to O5 buttons */}
      <div className="flex justify-center items-center gap-4 mb-2">
        {oLevels.map((level, idx) => (
          <React.Fragment key={level}>
            <button
              onClick={() => fetchOfficersByRank(level)}
              onMouseEnter={() => setHoveredNode(level)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`w-20 h-14 rounded-lg font-bold text-lg text-white transition-all shadow-md ${
                selectedNode === level ? 'bg-blue-700 ring-4 ring-blue-300 scale-105' : 'bg-blue-500'
              } ${hoveredNode === level ? 'scale-105' : 'scale-100'}`}
            >
              {level}
            </button>
            {idx < oLevels.length - 1 && (
              <div className="flex flex-col items-center">
                <div className="w-12 h-0.5 bg-blue-400"></div>
                {idx >= 2 && <span className="text-xs text-gray-500">QRS</span>}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Row 2: Dashed vertical lines */}
      <div className="flex justify-center gap-24 mb-2">
        {oLevels.map((level) => (
          <div key={`dash-${level}`} className="w-20 flex justify-center">
            <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-400"></div>
          </div>
        ))}
      </div>

      {/* Row 3: Role buttons - CO PILOT, WM, EL, IP, FE */}
      <div className="flex justify-center items-center gap-4 mb-2">
        <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-28 hover:bg-green-600">CO PILOT</button>
        <div className="text-xl text-gray-400">→</div>
        <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">WM</button>
        <div className="text-xl text-gray-400">→</div>
        <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">EL</button>
        <div className="text-xl text-gray-400">→</div>
        <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">IP</button>
        <div className="text-xl text-gray-400">→</div>
        <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">FE</button>
      </div>

      {/* Row 4: Sub-labels under roles */}
      <div className="flex justify-center gap-16 mb-4 text-xs text-gray-500">
        <div className="w-28 text-center">(O1-O2)</div>
        <div className="w-20 text-center">(O1-O2)</div>
        <div className="w-20 text-center">(O3)</div>
        <div className="w-20 text-center">(O4)</div>
        <div className="w-20 text-center">(O5)</div>
      </div>

      {/* Row 5: MTP and FC centered below */}
      <div className="flex justify-center items-center gap-16 mb-2">
        <div className="flex flex-col items-center">
          <div className="text-xl text-gray-400">↘</div>
          <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">MTP</button>
          <div className="text-xs text-gray-500">(O4)</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-xl text-gray-400">↙</div>
          <button className="px-3 py-2 bg-green-500 text-white rounded-lg font-semibold text-sm shadow-md w-20 hover:bg-green-600">FC</button>
          <div className="text-xs text-gray-500">(O4)</div>
        </div>
      </div>

      {/* Row 6: Double-headed arrows between MTP-IP and IP-FC */}
      <div className="flex justify-center items-center gap-28 mb-4">
        <div className="text-sm text-gray-500">↔</div>
        <div className="text-sm text-gray-500">↔</div>
      </div>

      {/* Legend */}
      <div className="mt-4 p-2 bg-gray-100 rounded-lg text-xs">
        <div className="flex flex-wrap gap-3 justify-center">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded"></span><span>O1-O5: Objectives</span></div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span><span>Functional Roles</span></div>
          <div className="flex items-center gap-1"><span className="text-gray-400">→</span><span>Primary Flow</span></div>
          <div className="flex items-center gap-1"><span className="text-gray-400">↔</span><span>Two-way</span></div>
          <div className="flex items-center gap-1"><span className="border-l-2 border-dashed border-gray-400 h-3"></span><span>Mapping</span></div>
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

      {/* Officers Table */}
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
                    <div className="w-8 text-gray-400">{expandedOfficer === officer.id ? '▲' : '▼'}</div>
                  </div>
                </div>

                {expandedOfficer === officer.id && careerHistory[officer.id] && (
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Career History</h4>
                    {careerHistory[officer.id].length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No career history available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-200">
                            <tr><th className="px-3 py-2">From</th><th className="px-3 py-2">To</th><th className="px-3 py-2">Unit</th><th className="px-3 py-2">Position</th><th className="px-3 py-2">Type</th></tr>
                          </thead>
                          <tbody>
                            {careerHistory[officer.id].map((h, hidx) => (
                              <tr key={hidx} className="border-b">
                                <td className="px-3 py-2">{formatDate(h.date_assumed)}</td>
                                <td className="px-3 py-2">{formatDate(h.date_relinquished)}</td>
                                <td className="px-3 py-2">{h.unit?.unit_code || '-'}</td>
                                <td className="px-3 py-2 max-w-md">{h.position?.position_title || '-'}</td>
                                <td className="px-3 py-2">{h.assignment_type || 'PERMANENT'}</td>
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

export default Dashboard;
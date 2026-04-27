import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

function CareerTable({ role, rankCode }) {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchOfficers = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE}/officers/officers/?page_size=100`, getAuthHeader());
        let allOfficers = response.data.results || [];
        
        // Filter by rank if rankCode provided
        if (rankCode && rankCode !== 'all') {
          const ranks = rankCode.split(',');
          allOfficers = allOfficers.filter(o => ranks.includes(o.rank));
        }
        
        setOfficers(allOfficers);
      } catch (error) {
        console.error(error);
        setOfficers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOfficers();
  }, [role, rankCode]);

  return (
    <div className="mt-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700">
          <h2 className="text-lg font-bold text-white">{role} OFFICERS</h2>
          <p className="text-green-100 text-sm">Career progression and qualification tracking</p>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : officers.length === 0 ? (
          <div className="text-center py-10 text-gray-400">No officers found for {role}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Family Name</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">PLATFORM</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">FLYING TIME</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">PILOT RATING</th>
                  <th className="px-3 py-2 text-center font-semibold text-gray-700">QUALIFICATION</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">REMARKS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {officers.map((officer) => (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-800">
                      {officer.rank} {officer.last_name}
                    </td>
                    <td className="px-3 py-2 text-gray-600">AW-109AH</td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {Math.round(officer.total_flight_hours || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">BASIC</span>
                    </td>
                    <td className="px-3 py-2 text-center"> </td>
                    <td className="px-3 py-2 text-gray-500"> </td>
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

export default CareerTable;
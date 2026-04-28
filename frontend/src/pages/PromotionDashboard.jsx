import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function PromotionDashboard() {
  const [officers, setOfficers] = useState([]);
  const [promotionPoints, setPromotionPoints] = useState({});
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedRank, setSelectedRank] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total_points');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState(null);

  const ranks = ['all', '2LT', '1LT', 'CPT', 'MAJ', 'LTC'];

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      window.location.href = '/';
      return {};
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let allOfficers = [];
      let nextUrl = `${API_BASE}/officers/officers/?page_size=100`;

      while (nextUrl) {
        const response = await axios.get(nextUrl, getAuthHeader());
        allOfficers = [...allOfficers, ...(response.data.results || [])];
        nextUrl = response.data.next;
      }

      setOfficers(allOfficers);

      const pointsRes = await axios.get(
        `${API_BASE}/promotion-points/points/?page_size=500`,
        getAuthHeader()
      );

      const pointsMap = {};
      (pointsRes.data.results || []).forEach((p) => {
        pointsMap[p.officer] = {
          qualification_points: parseFloat(p.qualification_points) || 0,
          instructor_points: parseFloat(p.instructor_points) || 0,
          special_duties_points: parseFloat(p.special_duties_points) || 0,
          command_o4_points: parseFloat(p.command_o4_points) || 0,
          command_o5_points: parseFloat(p.command_o5_points) || 0,
          total_points: parseFloat(p.total_points) || 0,
        };
      });

      setPromotionPoints(pointsMap);

      const ratingsRes = await axios.get(
        `${API_BASE}/qualifications/ratings/?page_size=500`,
        getAuthHeader()
      );

      const ratingsMap = {};
      (ratingsRes.data.results || []).forEach((r) => {
        ratingsMap[r.officer] = r.rating_level;
      });

      setRatings(ratingsMap);
    } catch (error) {
      console.error('Error fetching data:', error);

      if (error.response?.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.clear();
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setError('Failed to load data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getOfficerPoints = (officerId) => {
    const points = promotionPoints[officerId];
    if (!points)
      return { qual: 0, instructor: 0, special: 0, command_o4: 0, command_o5: 0, total: 0 };

    return {
      qual: points.qualification_points || 0,
      instructor: points.instructor_points || 0,
      special: points.special_duties_points || 0,
      command_o4: points.command_o4_points || 0,
      command_o5: points.command_o5_points || 0,
      total: points.total_points || 0,
    };
  };

  const getRatingBadge = (officerId) => {
    const rating = ratings[officerId];
    if (rating === 'COMMAND') return 'bg-yellow-100 text-yellow-800';
    if (rating === 'SENIOR') return 'bg-blue-100 text-blue-800';
    if (rating === 'BASIC') return 'bg-gray-100 text-gray-800';
    return 'bg-gray-100 text-gray-500';
  };

  const getRatingText = (officerId) => {
    return ratings[officerId] || 'N/A';
  };

  const getRankColor = (rank) => {
    const colors = {
      '2LT': 'bg-gray-600',
      '1LT': 'bg-blue-600',
      'CPT': 'bg-green-600',
      'MAJ': 'bg-purple-600',
      'LTC': 'bg-yellow-600',
    };
    return colors[rank] || 'bg-gray-600';
  };

  const getProgressBar = (value, max) => {
    const percentage = Math.min((value / max) * 100, 100);
    let color = 'bg-emerald-500';
    if (percentage < 30) color = 'bg-red-500';
    else if (percentage < 60) color = 'bg-yellow-500';
    else if (percentage < 80) color = 'bg-blue-500';

    return (
      <div className="w-20 bg-gray-200 rounded-full h-1.5">
        <div
          className={`${color} h-1.5 rounded-full`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const filteredOfficers = officers.filter((officer) => {
    if (selectedRank !== 'all' && officer.rank !== selectedRank) return false;
    const search = `${officer.first_name || ''} ${officer.last_name || ''} ${officer.rank || ''}`.toLowerCase();
    return search.includes(searchTerm.toLowerCase());
  });

  const sortedOfficers = [...filteredOfficers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc'
        ? a.last_name.localeCompare(b.last_name)
        : b.last_name.localeCompare(a.last_name);
    }
    if (sortBy === 'rank') {
      const rankOrder = { '2LT': 1, '1LT': 2, 'CPT': 3, 'MAJ': 4, 'LTC': 5 };
      const aRank = rankOrder[a.rank] || 0;
      const bRank = rankOrder[b.rank] || 0;
      return sortOrder === 'asc' ? aRank - bRank : bRank - aRank;
    }
    if (sortBy === 'rating') {
      const ratingOrder = { COMMAND: 3, SENIOR: 2, BASIC: 1 };
      const aRating = ratingOrder[ratings[a.id]] || 0;
      const bRating = ratingOrder[ratings[b.id]] || 0;
      return sortOrder === 'asc' ? aRating - bRating : bRating - aRating;
    }
    const aPoints = getOfficerPoints(a.id).total;
    const bPoints = getOfficerPoints(b.id).total;
    return sortOrder === 'asc' ? aPoints - bPoints : bPoints - aPoints;
  });

  if (loading) {
    return <div className="text-center py-20">Loading promotion data...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">📊 Promotion Points Dashboard</h1>
        <div className="flex gap-2">
          <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="px-3 py-1 border rounded text-sm">
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-1 border rounded text-sm">
            <option value="total_points">Sort by Total Points</option>
            <option value="name">Sort by Name</option>
            <option value="rank">Sort by Rank</option>
            <option value="rating">Sort by Rating</option>
          </select>
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-3 py-1 border rounded text-sm w-48" />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {ranks.map(rank => (
          <button key={rank} onClick={() => setSelectedRank(rank)} className={`px-3 py-1 text-sm rounded-full ${selectedRank === rank ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {rank === 'all' ? 'All' : rank}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="border-b">
                <th rowSpan="2" className="px-2 py-2 text-center w-8">#</th>
                <th rowSpan="2" className="px-2 py-2 text-left">Name</th>
                <th rowSpan="2" className="px-2 py-2 text-center w-16">Rank</th>
                <th rowSpan="2" className="px-2 py-2 text-center w-20">Rating</th>
                <th colSpan="1" className="px-2 py-2 text-center w-24">QUALIFICATION<br/>(5 PTS)</th>
                <th colSpan="1" className="px-2 py-2 text-center w-24">INSTRUCTOR<br/>(3 PTS)</th>
                <th colSpan="1" className="px-2 py-2 text-center w-24">SPECIAL<br/>(2 PTS)</th>
                <th colSpan="2" className="px-2 py-2 text-center w-32">COMMAND DUTIES</th>
                <th rowSpan="2" className="px-2 py-2 text-center w-24 font-bold text-blue-600">TOTAL<br/>(17 PTS)</th>
                <th rowSpan="2" className="px-2 py-2 text-center w-24">Progress</th>
              </tr>
              <tr className="bg-gray-50 border-b">
                <th className="px-2 py-1 text-center text-xs">Points</th>
                <th className="px-2 py-1 text-center text-xs">Points</th>
                <th className="px-2 py-1 text-center text-xs">Points</th>
                <th className="px-2 py-1 text-center text-xs">O-4 Pos<br/>(3 PTS)</th>
                <th className="px-2 py-1 text-center text-xs">O-5 Pos<br/>(4 PTS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedOfficers.map((officer, idx) => {
                const points = getOfficerPoints(officer.id);
                const maxTotal = 17;
                const totalPercent = Math.round((points.total / maxTotal) * 100);
                return (
                  <tr key={officer.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-500 text-center">{idx + 1}</td>
                    <td className="px-2 py-2 font-medium whitespace-nowrap">{officer.first_name} {officer.last_name}</td>
                    <td className="px-2 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs text-white ${getRankColor(officer.rank)}`}>{officer.rank}</span></td>
                    <td className="px-2 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRatingBadge(officer.id)}`}>{getRatingText(officer.id)}</span></td>
                    <td className="px-2 py-2 text-center font-mono">{points.qual.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-mono">{points.instructor.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-mono">{points.special.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-mono">{points.command_o4.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-mono">{points.command_o5.toFixed(2)}</td>
                    <td className="px-2 py-2 text-center font-bold text-emerald-600">{points.total.toFixed(2)}</td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        {getProgressBar(points.total, maxTotal)}
                        <span className="text-xs text-gray-500 w-8">{totalPercent}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 bg-gray-50 border-t text-sm text-gray-600">Showing {sortedOfficers.length} of {officers.length} officers</div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-3">
        <div className="bg-white rounded-lg shadow p-2 text-center"><p className="text-xl font-bold text-blue-600">{officers.length}</p><p className="text-xs text-gray-500">Total Officers</p></div>
        <div className="bg-white rounded-lg shadow p-2 text-center"><p className="text-xl font-bold text-yellow-600">{Object.values(ratings).filter(r => r === 'COMMAND').length}</p><p className="text-xs text-gray-500">Command</p></div>
        <div className="bg-white rounded-lg shadow p-2 text-center"><p className="text-xl font-bold text-blue-600">{Object.values(ratings).filter(r => r === 'SENIOR').length}</p><p className="text-xs text-gray-500">Senior</p></div>
        <div className="bg-white rounded-lg shadow p-2 text-center"><p className="text-xl font-bold text-gray-600">{Object.values(ratings).filter(r => r === 'BASIC').length}</p><p className="text-xs text-gray-500">Basic</p></div>
        <div className="bg-white rounded-lg shadow p-2 text-center"><p className="text-xl font-bold text-emerald-600">{sortedOfficers.reduce((sum, o) => sum + getOfficerPoints(o.id).total, 0).toFixed(0)}</p><p className="text-xs text-gray-500">Total Pts</p></div>
      </div>
    </div>
  );
}

export default PromotionDashboard;
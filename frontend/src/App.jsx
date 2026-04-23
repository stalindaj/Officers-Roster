import React, { useState, useEffect } from 'react';
import FlowchartDashboard from './components/FlowchartDashboard';
import DataTable from './components/DataTable';
import Login from './components/Login';
import axios from 'axios';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' or 'table'

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-gray-800">15SW Officer & Pilot Career Development Program</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1 rounded text-sm ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Flowchart
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`px-3 py-1 rounded text-sm ${activeView === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              Data Table
            </button>
          </div>
        </div>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600">
          Logout
        </button>
      </div>
      {activeView === 'dashboard' ? <FlowchartDashboard /> : <DataTable />}
    </div>
  );
}

export default App;
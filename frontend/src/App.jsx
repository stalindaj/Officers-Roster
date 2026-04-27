import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DataTable from './pages/DataTable';
import Profile from './pages/Profile';
import AdminDashboard from './pages/admin/AdminDashboard';
import DirectEdit from './pages/admin/DirectEdit';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState('dashboard');
  const [userRole, setUserRole] = useState(null);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setUserRole(localStorage.getItem('user_role'));
      setUsername(localStorage.getItem('username'));
    }
    setLoading(false);
  }, []);

  const handleLogin = (status) => {
    setIsAuthenticated(status);
    setUserRole(localStorage.getItem('user_role'));
    setUsername(localStorage.getItem('username'));
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const isSuperAdmin = userRole === 'superadmin';
  const isAdmin = userRole === 'admin' || isSuperAdmin;

 const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', show: true },
  { id: 'ranked', label: 'By Rank', icon: '🎖️', show: true },
  { id: 'table', label: 'All Officers', icon: '📋', show: true },
  { id: 'admin', label: 'Admin', icon: '⚙️', show: isAdmin },
  { id: 'direct-edit', label: '✏️ Direct Edit', icon: '✏️', show: isSuperAdmin },
  { id: 'profile', label: 'Profile', icon: '👤', show: true },
];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-800">15SW Officer Tracker</h1>
            <div className="flex gap-1">
              {navItems.filter(item => item.show).map(item => (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activePage === item.id ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {username} ({isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : userRole})
            </span>
            <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 transition">Logout</button>
          </div>
        </div>
      </nav>

      <main className="p-6">
          {activePage === 'dashboard' && <Dashboard />}
          {activePage === 'ranked' && <RankedOfficers />}
          {activePage === 'table' && <DataTable />}
          {activePage === 'admin' && isAdmin && <AdminDashboard />}
          {activePage === 'direct-edit' && isSuperAdmin && <DirectEdit />}
          {activePage === 'profile' && <Profile username={username} role={userRole} />}
      </main>
    </div>
  );
}

export default App;
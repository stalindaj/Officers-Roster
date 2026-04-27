import { API_BASE } from '../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function Profile({ username, role }) {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/users/me/`, getAuthHeader());
        setUserData(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const getRoleBadge = () => {
    const colors = { superadmin: 'bg-red-600', admin: 'bg-blue-600', operations: 'bg-green-600', viewer: 'bg-gray-600' };
    return colors[role] || 'bg-gray-600';
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-8 text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-4xl font-bold text-blue-700">
            {username?.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white mt-4">{username}</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${getRoleBadge()} mt-2`}>
            {role === 'superadmin' ? 'Super Administrator' : role === 'admin' ? 'Administrator' : role === 'operations' ? 'Operations' : 'Viewer'}
          </span>
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Username:</span><span className="font-medium">{userData?.username}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Email:</span><span className="font-medium">{userData?.email || 'Not set'}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Role:</span><span className="font-medium">{role}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Member Since:</span><span className="font-medium">{new Date(userData?.date_joined).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Your Permissions</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {role === 'superadmin' && <li>✅ Full system access - can edit, delete, and approve requests</li>}
              {role === 'admin' && <li>✅ Can create data change requests</li>}
              {role === 'operations' && <li>✅ Can view all data (read-only)</li>}
              <li>✅ Can generate reports</li>
              <li>✅ Can view officer career histories</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
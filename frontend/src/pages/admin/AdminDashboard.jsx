import React, { useState } from 'react';
import CreateRequest from './CreateRequest';
import PendingRequests from './PendingRequests';
import MyRequests from './MyRequests';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('create');
  const userRole = localStorage.getItem('user_role');

  const isSuperAdmin = userRole === 'superadmin';

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-800">Request Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isSuperAdmin ? 'Review and approve pending requests' : 'Submit requests for data changes'}
          </p>
        </div>

        <div className="border-b">
          <nav className="flex gap-1 px-4">
            <button onClick={() => setActiveTab('create')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              📝 Create Request
            </button>
            <button onClick={() => setActiveTab('my')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              📋 My Requests
            </button>
            {isSuperAdmin && (
              <button onClick={() => setActiveTab('pending')} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                ⏳ Pending Approval
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'create' && <CreateRequest />}
          {activeTab === 'my' && <MyRequests />}
          {activeTab === 'pending' && isSuperAdmin && <PendingRequests />}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
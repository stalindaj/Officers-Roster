import { API_BASE } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/requests/requests/`, getAuthHeader());
      setRequests(response.data.results || []);
    } catch (error) {
      console.error(error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      IN_REVIEW: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRequestIcon = (type) => {
    const icons = {
      OFFICER_CREATE: '👨‍✈️',
      OFFICER_UPDATE: '✏️',
      FLIGHT_HOURS_ADD: '✈️',
      ASSIGNMENT_ADD: '📋',
      PROMOTION_POINTS_ADD: '⭐',
      QUALIFICATION_ADD: '🎓',
      BULK_IMPORT: '📊',
    };
    return icons[type] || '📝';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">My Requests</h2>
        <button onClick={fetchMyRequests} className="text-blue-600 hover:text-blue-800 text-sm">Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No requests found</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRequestIcon(request.request_type)}</span>
                  <div>
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-500">{request.request_type?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400">Submitted: {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                    {request.status}
                  </span>
                  <button onClick={() => setSelectedRequest(request)} className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedRequest(null)}>
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSelectedRequest(null)}></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4">Request Details</h3>
              <div className="space-y-3">
                <p><strong>Type:</strong> {selectedRequest.request_type?.replace(/_/g, ' ')}</p>
                <p><strong>Status:</strong> <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedRequest.status)}`}>{selectedRequest.status}</span></p>
                <p><strong>Submitted:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                <p><strong>Description:</strong> {selectedRequest.description || 'No description'}</p>
                {selectedRequest.rejection_reason && (
                  <p><strong>Rejection Reason:</strong> <span className="text-red-600">{selectedRequest.rejection_reason}</span></p>
                )}
                {selectedRequest.data && (
                  <div className="bg-gray-50 p-3 rounded">
                    <strong>Data:</strong>
                    <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(selectedRequest.data, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyRequests
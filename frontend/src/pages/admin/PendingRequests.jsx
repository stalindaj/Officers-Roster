import { API_BASE } from '../../config';
import React, { useState, useEffect } from 'react';
import axios from 'axios';


function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/requests/requests/?status=PENDING`, getAuthHeader());
      setRequests(response.data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (request) => {
    if (window.confirm('Approve this request? This will update the database.')) {
      try {
        await axios.post(`${API_BASE}/requests/requests/${request.id}/approve/`, {}, getAuthHeader());
        fetchRequests();
        alert('Request approved successfully!');
      } catch (error) {
        console.error(error);
        alert('Error approving request');
      }
    }
  };

  const handleReject = async (request) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await axios.post(`${API_BASE}/requests/requests/${request.id}/reject/`, { reason }, getAuthHeader());
        fetchRequests();
        alert('Request rejected');
      } catch (error) {
        console.error(error);
        alert('Error rejecting request');
      }
    }
  };

  const getRequestIcon = (type) => {
    const icons = {
      'OFFICER_CREATE': '👨‍✈️',
      'OFFICER_UPDATE': '✏️',
      'FLIGHT_HOURS_ADD': '✈️',
      'ASSIGNMENT_ADD': '📋',
      'PROMOTION_POINTS_ADD': '⭐',
      'QUALIFICATION_ADD': '🎓',
      'BULK_IMPORT': '📊',
    };
    return icons[type] || '📝';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Pending Approval Requests</h2>
        <button onClick={fetchRequests} className="text-blue-600 hover:text-blue-800">Refresh</button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-10 text-gray-400">No pending requests</div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRequestIcon(request.request_type)}</span>
                  <div>
                    <h3 className="font-semibold">{request.title}</h3>
                    <p className="text-sm text-gray-500">{request.get_request_type_display}</p>
                    <p className="text-xs text-gray-400">Submitted by: {request.created_by_username} on {new Date(request.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedRequest(request)} className="text-blue-600 hover:text-blue-800 text-sm">View Details</button>
                  <button onClick={() => handleApprove(request)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">Approve</button>
                  <button onClick={() => handleReject(request)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
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
                <p><strong>Type:</strong> {selectedRequest.get_request_type_display}</p>
                <p><strong>Submitted by:</strong> {selectedRequest.created_by_username}</p>
                <p><strong>Date:</strong> {new Date(selectedRequest.created_at).toLocaleString()}</p>
                <p><strong>Description:</strong> {selectedRequest.description}</p>
                <div className="bg-gray-50 p-3 rounded">
                  <strong>Data:</strong>
                  <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(selectedRequest.data, null, 2)}</pre>
                </div>
                {selectedRequest.files && selectedRequest.files.length > 0 && (
                  <div>
                    <strong>Attached Files:</strong>
                    {selectedRequest.files.map(file => (
                      <a key={file.id} href={file.file} target="_blank" rel="noopener noreferrer" className="block text-blue-600">📎 {file.filename}</a>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setSelectedRequest(null)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PendingRequests;
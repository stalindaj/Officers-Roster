import { API_BASE } from '../config';
import React from 'react';

function Sidebar({ isOpen, onClose, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'officers', label: 'Officers', icon: '👨‍✈️' },
    { id: 'assignments', label: 'Assignments', icon: '📋' },
    { id: 'flight-logs', label: 'Flight Logs', icon: '✈️' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={onClose} />
      )}
      <div className={`fixed top-0 left-0 z-30 w-64 h-full bg-gray-900 text-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold">15SW Tracker</h1>
          <p className="text-xs text-gray-400 mt-1">Officer System</p>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <a key={item.id} href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white w-full"
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
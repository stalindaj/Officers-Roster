import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [hoveredNode, setHoveredNode] = useState(null);
  const oLevels = ['O1', 'O2', 'O3', 'O4', 'O5'];

  const handleRankClick = (level) => {
    navigate(`/officers/${level}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-center mb-6 text-gray-800">15SW Pilot Career Progression Flowchart</h2>
      
      {/* Row 1: O1 to O5 buttons */}
      <div className="flex justify-center items-center gap-4 mb-2">
        {oLevels.map((level, idx) => (
          <React.Fragment key={level}>
            <button
              onClick={() => handleRankClick(level)}
              onMouseEnter={() => setHoveredNode(level)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`w-20 h-14 rounded-lg font-bold text-lg text-white transition-all shadow-md ${
                hoveredNode === level ? 'bg-blue-700 ring-4 ring-blue-300 scale-105' : 'bg-blue-500'
              }`}
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

      {/* Row 3: Role buttons */}
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

      {/* Row 4: Sub-labels */}
      <div className="flex justify-center gap-16 mb-4 text-xs text-gray-500">
        <div className="w-28 text-center">(O1-O2)</div>
        <div className="w-20 text-center">(O1-O2)</div>
        <div className="w-20 text-center">(O3)</div>
        <div className="w-20 text-center">(O4)</div>
        <div className="w-20 text-center">(O5)</div>
      </div>

      {/* Row 5: MTP and FC */}
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

      {/* Row 6: Double-headed arrows */}
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
    </div>
  );
}

export default Dashboard;
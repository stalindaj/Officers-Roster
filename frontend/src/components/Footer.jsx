import { API_BASE } from '../config';

import React from 'react';

function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-3 mt-4">
      <div className="text-center text-xs text-gray-500">
        © {year} 15SW Officer Tracking System. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
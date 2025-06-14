'use client';

import { Menu, X } from 'lucide-react';
import React from 'react';

export function TestMobileSidebar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      {/* Test Toggle Button */}
      <button
        onClick={() => {
          console.log('Test button clicked, current state:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="fixed top-20 left-4 p-2 bg-red-500 text-white rounded z-[9999]"
      >
        Test Toggle
      </button>

      {/* Test Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[40]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Test Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 w-64 bg-blue-500 text-white z-[50]
          transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-4">
          <h3>Test Sidebar</h3>
          <p>State: {isOpen ? 'Open' : 'Closed'}</p>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 p-2 bg-red-500 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

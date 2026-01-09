import React from 'react';

function TabNavigation({ activeTab, onTabChange }) {
  return (
    <div className="flex bg-white border-b border-gray-200">
      <button
        className={`flex-1 p-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
          activeTab === 'review' ? 'text-indigo-600 border-indigo-600 bg-gray-50' : 'text-gray-600 border-transparent hover:text-indigo-600'
        }`}
        onClick={() => onTabChange('review')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v6l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
        Today Review
      </button>
      <button
        className={`flex-1 p-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
          activeTab === 'vocabulary' ? 'text-indigo-600 border-indigo-600 bg-gray-50' : 'text-gray-600 border-transparent hover:text-indigo-600'
        }`}
        onClick={() => onTabChange('vocabulary')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12v8H2z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          <path d="M6 8h4M6 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Vocabulary
      </button>
      <button
        className={`flex-1 p-3 text-sm font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
          activeTab === 'add' ? 'text-indigo-600 border-indigo-600 bg-gray-50' : 'text-gray-600 border-transparent hover:text-indigo-600'
        }`}
        onClick={() => onTabChange('add')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add Word
      </button>
    </div>
  );
}

export default TabNavigation;
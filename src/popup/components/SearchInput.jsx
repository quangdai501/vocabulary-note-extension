import React from 'react';

function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      />
    </div>
  );
}

export default SearchInput;
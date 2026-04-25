import React from 'react';

function Header({ totalWords, dueWords, onSettingsClick, user }) {
  const handleAuthClick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  };

  return (
    <header className="bg-linear-to-r from-indigo-500 to-purple-600 text-white p-5">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.6"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Vocabulary Note
        </h1>
        <button
          onClick={handleAuthClick}
          className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full transition-colors"
          title={`Signed in as ${user.email}`}
        >
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-4 h-4 rounded-full" />
          ) : (
            <span className="w-4 h-4 rounded-full bg-white/40 flex items-center justify-center text-xs font-bold">
              {user.email?.[0]?.toUpperCase()}
            </span>
          )}
          <span className="opacity-90">{user.displayName || user.email}</span>
        </button>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-white/10 rounded transition-colors" onClick={onSettingsClick} title="Open full options">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v1M8 11v1M6 6h1M11 6h1M6 10h1M11 10h1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1 opacity-90">
            <span className="font-medium">Total:</span>
            <span className="font-bold text-lg">{totalWords}</span>
          </span>
          <span className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
            <span className="font-medium">Due:</span>
            <span className="font-bold text-lg">{dueWords}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

export default Header;
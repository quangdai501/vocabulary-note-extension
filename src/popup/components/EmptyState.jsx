import React from 'react';

function EmptyState({ hasVocabulary, hasSearchResults }) {
  const isNoVocabulary = !hasVocabulary;
  const isNoSearchResults = hasVocabulary && !hasSearchResults;

  return (
    <div className="flex flex-col items-center justify-center text-center py-10 text-gray-500">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-4 text-gray-300">
        <path d="M16 16h32v32H16z" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M24 28h16M24 36h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-lg font-medium text-gray-700 mb-1">
        {isNoVocabulary ? 'No vocabulary yet' : 'No matches found'}
      </p>
      <p className="text-sm text-gray-500">
        {isNoVocabulary
          ? 'Start saving words to build your vocabulary!'
          : 'Try a different search term'
        }
      </p>
    </div>
  );
}

export default EmptyState;
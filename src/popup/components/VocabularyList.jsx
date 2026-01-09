import React from 'react';
import WordCard from './WordCard.jsx';

function VocabularyList({ vocabulary, onPlayPronunciation, onDeleteWord, onEditNextReview }) {
  return (
    <div className="space-y-3">
      {vocabulary.map(word => (
        <WordCard
          key={word.id}
          word={word}
          onPlayPronunciation={onPlayPronunciation}
          onDeleteWord={onDeleteWord}
          onEditNextReview={onEditNextReview}
        />
      ))}
    </div>
  );
}

export default VocabularyList;
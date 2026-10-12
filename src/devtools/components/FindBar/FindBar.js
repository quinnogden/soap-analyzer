import React from 'react';
import './FindBar.css';

/*
 * A find box, with how many matches there are and buttons to step through
 * them. Enter goes to the next match, and Shift+Enter to the previous one.
 */
const FindBar = (props) => {
  const { query, matchCount, selectedMatch } = props;
  let status = '';
  if(query && matchCount) {
    status = `${(selectedMatch + 1).toLocaleString()} of ${matchCount.toLocaleString()}`;
  } else if(query) {
    status = 'No matches';
  }
  const handleKeyDown = (event) => {
    if(event.key !== 'Enter') return;
    event.preventDefault();
    if(event.shiftKey) {
      props.onPrevious();
    } else {
      props.onNext();
    }
  };
  return (
    <div className="FindBar">
      <input
        type="search"
        className="FindBar__input"
        placeholder={props.placeholder}
        aria-label={props.placeholder}
        value={query}
        onChange={(event) => props.onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        ref={props.inputRef}
      />
      <span className="FindBar__status" aria-live="polite">{status}</span>
      <button
        type="button"
        className="FindBar__button"
        title="Previous match (Shift+Enter)"
        aria-label="Previous match"
        disabled={!matchCount}
        onClick={props.onPrevious}
      >
        <span className="glyphicon glyphicon-chevron-up"></span>
      </button>
      <button
        type="button"
        className="FindBar__button"
        title="Next match (Enter)"
        aria-label="Next match"
        disabled={!matchCount}
        onClick={props.onNext}
      >
        <span className="glyphicon glyphicon-chevron-down"></span>
      </button>
    </div>
  );
};

export default FindBar;

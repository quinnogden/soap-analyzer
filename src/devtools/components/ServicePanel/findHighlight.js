import brace from 'brace';

const Range = brace.acequire('ace/range').Range;

// The highlight added to each editor, made the first time it's highlighted
const highlights = new WeakMap();

const toRange = (match) => new Range(match.row, match.start, match.row, match.end);

const createHighlight = (editor) => {
  const highlight = {
    matches: [],
    matchesByRow: new Map(),
    selected: null,
    // Ace's marker layer calls this to draw, and only the rows on screen are
    // drawn, so a short query doesn't slow down a long response
    update: (html, markerLayer, session, config) => {
      for(let row = config.firstRow; row <= config.lastRow; row++) {
        (highlight.matchesByRow.get(row) || []).forEach((match) => {
          const className = match === highlight.selected ? 'FindMatch FindMatch--selected' : 'FindMatch';
          markerLayer.drawSingleLineMarker(html, toRange(match).toScreenRange(session), className, config);
        });
      }
    }
  };
  editor.session.addDynamicMarker(highlight);
  highlights.set(editor, highlight);
  return highlight;
};

/*
 * Highlights matches (from findMatches in util.js) in an Ace editor, with the
 * selected one in its own color
 */
export const highlightMatches = (editor, matches, selectedIndex) => {
  const highlight = highlights.get(editor) || createHighlight(editor);
  const selected = matches[selectedIndex] || null;
  if(highlight.matches === matches && highlight.selected === selected) return;
  if(highlight.matches !== matches) {
    highlight.matches = matches;
    highlight.matchesByRow = new Map();
    matches.forEach((match) => {
      const rowMatches = highlight.matchesByRow.get(match.row);
      if(rowMatches) {
        rowMatches.push(match);
      } else {
        highlight.matchesByRow.set(match.row, [match]);
      }
    });
  }
  highlight.selected = selected;
  editor.renderer.updateBackMarkers();
};

// Scrolls an editor to a match, opening any folds that hide it
export const revealMatch = (editor, match) => {
  const range = toRange(match);
  editor.session.unfold(range);
  // An editor that was hidden in another tab, or was just created, hasn't
  // measured or drawn itself yet, and can't work out where to scroll
  editor.resize(true);
  // Leaves the scroll alone if the match is on screen, and otherwise centers it
  editor.renderer.scrollSelectionIntoView(range.start, range.end, 0.5);
};

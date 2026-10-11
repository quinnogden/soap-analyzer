import brace from 'brace';
// Defines the indentation-based folding used below
import 'brace/mode/yaml';

/*
 * Ace mode for the readable view (see toReadable in util.js), which highlights
 * the names and values of its "name: value" lines, and folds by indentation
 */
brace.define('ace/mode/readable', ['require', 'exports', 'module', 'ace/lib/oop', 'ace/mode/text', 'ace/mode/text_highlight_rules', 'ace/mode/folding/coffee'], (acequire, exports) => {
  const oop = acequire('ace/lib/oop');
  const TextMode = acequire('ace/mode/text').Mode;
  const TextHighlightRules = acequire('ace/mode/text_highlight_rules').TextHighlightRules;
  const IndentationFoldMode = acequire('ace/mode/folding/coffee').FoldMode;

  const ReadableHighlightRules = function() {
    this.$rules = {
      start: [
        // A line of a value that has several
        { token: ['text', 'string'], regex: /^(\s*\|)(.*)$/ },
        { token: ['text', 'keyword', 'text', 'string'], regex: /^(\s*)(.+?)(:)(\s.*|$)/ }
      ]
    };
  };
  oop.inherits(ReadableHighlightRules, TextHighlightRules);

  const Mode = function() {
    this.HighlightRules = ReadableHighlightRules;
    this.foldingRules = new IndentationFoldMode();
  };
  oop.inherits(Mode, TextMode);
  Mode.prototype.$id = 'ace/mode/readable';

  exports.Mode = Mode;
});

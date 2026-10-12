import React from 'react';
import brace from 'brace';
import AceEditor from 'react-ace';
import FindBar from '../FindBar/FindBar';
import StatList from '../StatList/StatList';
import Tabs from '../Tabs/Tabs';
import TabPanel from '../TabPanel/TabPanel';
import { findMatches } from '../../util';
import { highlightMatches, revealMatch } from './findHighlight';
import 'brace/theme/github';
import 'brace/theme/tomorrow_night';
import 'brace/mode/xml';
import './readableMode';
import './ServicePanel.css';

// The tabs with an editor, which the find bar searches
const EDITOR_TABS = ['Request', 'Response'];

// The text each editor shows, for the active service and view settings
const getEditorValues = ({ activeService, hideXmlns, onlyBody, readableView }) => {
  if(!activeService) return {};
  let requestValue;
  let responseValue;
  // The readable view always leaves out namespaces
  if(readableView && onlyBody) {
    requestValue = activeService.readableRequestOnlyBody;
    responseValue = activeService.readableResponseOnlyBody;
  } else if(readableView) {
    requestValue = activeService.readableRequest;
    responseValue = activeService.readableResponse;
  } else if(hideXmlns && !onlyBody) {
    requestValue = activeService.prettyRequestNoXmlns;
    responseValue = activeService.prettyResponseNoXmlns;
  } else if(!hideXmlns && onlyBody) {
    requestValue = activeService.prettyRequestOnlyBody;
    responseValue = activeService.prettyResponseOnlyBody;
  } else if(hideXmlns && onlyBody) {
    requestValue = activeService.prettyRequestNoXmlnsOnlyBody;
    responseValue = activeService.prettyResponseNoXmlnsOnlyBody;
  } else {
    requestValue = activeService.prettyRequest;
    responseValue = activeService.prettyResponse;
  }
  return { Request: requestValue, Response: responseValue };
};

class ServicePanel extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 'Request',
      query: '',
      values: getEditorValues(props),
      // Index of the selected match on each editor tab
      selectedMatches: { Request: 0, Response: 0 }
    };
    // The react-ace components, by tab
    this.editors = {};
    this.matchCache = {};
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleQueryChange = this.handleQueryChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.selectNextMatch = this.selectMatch.bind(this, 1);
    this.selectPreviousMatch = this.selectMatch.bind(this, -1);
    this.revealSelectedMatch = this.revealSelectedMatch.bind(this);
  }

  // Keeps the editors' text in state, so new text starts from its first match,
  // the same way it starts scrolled to the top
  static getDerivedStateFromProps(props, state) {
    const values = getEditorValues(props);
    const isNewText = (tab) => values[tab] !== state.values[tab];
    if(!EDITOR_TABS.some(isNewText)) return null;
    const selectedMatches = {};
    EDITOR_TABS.forEach((tab) => {
      selectedMatches[tab] = isNewText(tab) ? 0 : state.selectedMatches[tab];
    });
    return { values, selectedMatches };
  }

  componentDidMount() {
    // Capturing, so it's seen before Ace or DevTools act on it
    window.addEventListener('keydown', this.handleKeyDown, true);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown, true);
  }

  componentDidUpdate(prevProps, prevState) {
    const { activeTab, values, selectedMatches } = this.state;
    EDITOR_TABS.forEach((tab) => {
      const aceEditor = this.editors[tab];
      if(!aceEditor) return;
      const { editor } = aceEditor;
      // Only for new text, so that other updates, like a new call in the list,
      // don't lose the scroll position
      const isNewText = values[tab] !== prevState.values[tab];
      if(isNewText) {
        editor.scrollToLine(0, false, false);
        aceEditor.refEditor.getElementsByClassName('ace_scrollbar-h')[0].scrollLeft = 0;
      }
      highlightMatches(editor, this.getMatches(tab), selectedMatches[tab]);
      if(tab !== activeTab) return;
      const isNewlyShown = activeTab !== prevState.activeTab;
      if(isNewlyShown) {
        /*
         * Address issue with ace editor, where editor does not update if initially
         * hidden, have to trigger update on resize
         * https://github.com/securingsincity/react-ace/issues/204
         */
        editor.resize();
        editor.renderer.updateFull();
        editor.clearSelection();
      }
      if(isNewText || isNewlyShown) {
        this.revealSelectedMatch();
      }
    });
  }

  handleTabClick(activeTab) {
    this.setState(() => ({ activeTab }));
  }

  handleQueryChange(query) {
    const selectedMatches = {};
    EDITOR_TABS.forEach((tab) => {
      selectedMatches[tab] = this.getFirstMatchIndex(tab, query);
    });
    this.setState(() => ({ query, selectedMatches }), this.revealSelectedMatch);
  }

  // Ctrl+F (Cmd+F on a Mac) goes to the find box, rather than to Ace's or
  // DevTools' own find
  handleKeyDown(event) {
    const isFind = (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey &&
      String(event.key).toLowerCase() === 'f';
    if(!isFind || !this.findInput) return;
    event.preventDefault();
    event.stopPropagation();
    this.findInput.focus();
    this.findInput.select();
  }

  // Matches of the query in a tab's text, only searched again when either changes
  getMatches(tab, query = this.state.query) {
    const value = this.state.values[tab];
    const cached = this.matchCache[tab];
    if(!cached || cached.value !== value || cached.query !== query) {
      this.matchCache[tab] = { value, query, matches: findMatches(value, query) };
    }
    return this.matchCache[tab].matches;
  }

  /*
   * Where a new query's matches start from: the old query's selected match, so
   * typing more of a word doesn't jump away from it, or else the top of what's
   * on screen
   */
  getFirstMatchIndex(tab, query) {
    const aceEditor = this.editors[tab];
    const selected = this.getMatches(tab)[this.state.selectedMatches[tab]];
    const from = selected || {
      row: aceEditor ? aceEditor.editor.renderer.getFirstFullyVisibleRow() : 0,
      start: 0
    };
    const index = this.getMatches(tab, query).findIndex((match) => {
      return match.row > from.row || (match.row === from.row && match.start >= from.start);
    });
    // Wraps around to the first match, like stepping past the last one does
    return Math.max(index, 0);
  }

  // Steps through the active tab's matches, wrapping around at either end
  selectMatch(step) {
    const { activeTab } = this.state;
    const matchCount = this.getMatches(activeTab).length;
    if(!matchCount) return;
    this.setState(({ selectedMatches }) => ({
      selectedMatches: Object.assign({}, selectedMatches, {
        [activeTab]: (selectedMatches[activeTab] + step + matchCount) % matchCount
      })
    }), this.revealSelectedMatch);
  }

  revealSelectedMatch() {
    const { activeTab, selectedMatches } = this.state;
    const aceEditor = this.editors[activeTab];
    const match = this.getMatches(activeTab)[selectedMatches[activeTab]];
    if(aceEditor && match) {
      revealMatch(aceEditor.editor, match);
    }
  }

  render() {
    const { activeService, theme, readableView } = this.props;
    if(!activeService) return null;
    const { activeTab, query, values, selectedMatches } = this.state;
    // Map SOAP Analyzer themes to brace themes
    const editorTheme = {
      'default': 'github',
      'dark': 'tomorrow_night'
    };
    const editorSettings = {
      mode: readableView ? 'readable' : 'xml',
      theme: editorTheme[theme],
      fontSize: 15,
      tabSize: 2,
      readOnly: true,
      width: 'inherit',
      height: 'calc(100vh - 58px)',
      showPrintMargin: false,
      highlightActiveLine: false,
      editorProps: {$blockScrolling: true},
      // Ace's syntax-check worker loads from a blob: URL, which the
      // Manifest V3 content security policy blocks
      setOptions: {useWorker: false}
    };
    const requestSettings = Object.assign({}, editorSettings, {
      value: values.Request,
      ref: (aceEditor) => { this.editors.Request = aceEditor; }
    });
    const responseSettings = Object.assign({}, editorSettings, {
      value: values.Response,
      ref: (aceEditor) => { this.editors.Response = aceEditor; }
    });
    // While there's a query, each editor tab shows how many matches it has
    const matchCount = (tab) => (query ? this.getMatches(tab).length : undefined);
    const findBar = EDITOR_TABS.includes(activeTab) ? (
      <FindBar
        query={query}
        placeholder={`Find in ${activeTab.toLowerCase()}`}
        matchCount={this.getMatches(activeTab).length}
        selectedMatch={selectedMatches[activeTab]}
        onQueryChange={this.handleQueryChange}
        onNext={this.selectNextMatch}
        onPrevious={this.selectPreviousMatch}
        inputRef={(input) => { this.findInput = input; }}
      />
    ) : null;
    return (
      <div className="ServicePanel">
        {/* Tabs only reads activeTab when it mounts, which is again after the list is cleared */}
        <Tabs activeTab={activeTab} onTabClick={this.handleTabClick} toolbar={findBar}>
          <TabPanel name="Request" key="1" badge={matchCount('Request')}>
            <AceEditor {...requestSettings} />
          </TabPanel>
          <TabPanel name="Response" key="2" badge={matchCount('Response')}>
            <AceEditor {...responseSettings} />
          </TabPanel>
          <TabPanel name="Details" key="3">
            <StatList webService={activeService} />
          </TabPanel>
        </Tabs>
      </div>
    );
  }

}

export default ServicePanel;

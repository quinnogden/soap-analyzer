import 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App/App';
import 'bootstrap/dist/js/bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import './themes/themes.css';

const defaultSettings = {
  hideXmlns: true,
  onlyBody : true,
  preserveLog: false,
  showInterfaceNames: false,
  // Percentage of the panel's width
  listWidth: 25
};

// Follow the DevTools theme rather than a separate setting
const theme = chrome.devtools.panels.themeName === 'dark' ? 'dark' : 'default';

chrome.storage.sync.get(defaultSettings, (settings) => {
  ReactDOM.render(
    <App settings={settings} theme={theme} />,
    document.getElementById('root')
  );
});

import React from 'react';
import './Header.css';

const Header = (props) => (
  <div className="Header form-inline">
    <div className="form-group">
      <button className="btn btn-primary btn-xs" onClick={props.clearServices}>
        <span className="glyphicon glyphicon-ban-circle"></span>
        Clear
      </button>
    </div>
    <div className="form-group">
      <input
        type="search"
        className="Header__filter"
        placeholder="Filter"
        aria-label="Filter services by name"
        value={props.filter}
        onChange={(event) => props.setFilter(event.target.value)}
      />
    </div>
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={props.preserveLog} onChange={props.togglePreserveLog} /> Preserve log
        </label>
      </div>
    </div>
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={props.showInterfaceNames} onChange={props.toggleShowInterfaceNames} /> Show interface names
        </label>
      </div>
    </div>
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={props.readableView} onChange={props.toggleReadableView} /> Readable view
        </label>
      </div>
    </div>
    <div className="form-group">
      <div className={`checkbox ${props.readableView ? 'disabled' : ''}`}>
        <label title={props.readableView ? 'The readable view always hides them' : ''}>
          <input type="checkbox" checked={props.hideXmlns} onChange={props.toggleHideXmlns} disabled={props.readableView} /> Hide XML namespaces
        </label>
      </div>
    </div>
    <div className="form-group">
      <div className="checkbox">
        <label>
          <input type="checkbox" checked={props.onlyBody} onChange={props.toggleOnlyBody} /> Only body contents
        </label>
      </div>
    </div>
  </div>
);

export default Header;

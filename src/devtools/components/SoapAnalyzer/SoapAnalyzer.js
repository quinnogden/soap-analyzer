import React from 'react';
import Header from '../Header/Header';
import ServiceList from '../ServiceList/ServiceList';
import ServicePanel from '../ServicePanel/ServicePanel';
import SplitView from '../SplitView/SplitView';

export default (props) => (
  <div className={`theme-${props.theme}`}>
    <div className="App">
      <div className="row">
        <div className="col-xs-12">
          <Header {...props} />
        </div>
      </div>
      <div className="row">
        <SplitView
          leftWidth={props.settings.listWidth}
          onResizeEnd={props.saveListWidth}
          leftClassName="col-xs-3 web-service-list-container"
          rightClassName="col-xs-9 web-service-details-container"
          left={<ServiceList {...props} />}
          right={<ServicePanel {...props} />}
        />
      </div>
    </div>
  </div>
);

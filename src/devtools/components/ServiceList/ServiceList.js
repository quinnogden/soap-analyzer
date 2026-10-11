import React from 'react';
import { getListNames } from '../../util';
import './ServiceList.css';

const ServiceList = ({ services, showInterfaceNames, setActiveService }) => {
  const serviceItems = services.map((service) => {
    const isSelectedClass = service.isActive ? 'selected' : '';
    const isFailedClass = service.failed ? 'failed' : '';
    const names = getListNames(service, showInterfaceNames);
    const attrs = {
      key: service.id,
      className: `list-group-item ${isSelectedClass} ${isFailedClass}`,
      // Long names are cut off, so show them in full on hover
      title: names.join('\n'),
      onClick: () => setActiveService(service.id)
    };
    return (
      <li {...attrs}>
        {names.map((name) => <div key={name} className="ServiceList__name">{name}</div>)}
      </li>
    );
  });
  return (
    <div className="ServiceList">
      <ul className="list-group">
        {serviceItems}
      </ul>
    </div>
  );
}

export default ServiceList;

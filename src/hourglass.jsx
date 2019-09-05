import React from 'react';
import PropTypes from 'prop-types';

export default function Hourglass({ active, children }) {
  return (
    <div className={'hourglass' + (active ? ' hourglass-active' : '')}>{children}</div>
  );
}

Hourglass.propTypes = {
  active: PropTypes.bool,
  children: PropTypes.node
};

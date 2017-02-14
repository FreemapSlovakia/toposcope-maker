const React = require('react');

module.exports = Hourglass;

function Hourglass({ active, children }) {
  return (
    <div className={'hourglass' + (active ? ' hourglass-active' : '')}>{children}</div>
  );
}

Hourglass.propTypes = {
  active: React.PropTypes.bool,
  children: React.PropTypes.node
};

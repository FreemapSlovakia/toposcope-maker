import Toposcope from './toposcope.jsx';
import React from 'react';
import ReactDOM from 'react-dom';

// activePoiId: React.PropTypes.number,
// innerCircleRadius: React.PropTypes.number,
// outerCircleRadius: React.PropTypes.number,
// fontSize: React.PropTypes.number,
// inscriptions: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
// pois: React.PropTypes.array.isRequired,
// title: React.PropTypes.string,
// language: React.PropTypes.string.isRequired,
// preventUpturnedText: React.PropTypes.bool,
// onClick: React.PropTypes.func

export function render(element, props) {
  ReactDOM.render(<Toposcope {...props}/>, element);
}

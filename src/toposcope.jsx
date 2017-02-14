const React = require('react');

module.exports = Toposcope;

function Toposcope({ baseLat, baseLng, pois, innerRadius = 15, outerRadius = 90 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="-100 -100 200 200">
      <style>{`
        .line {
          stroke: #000000;
          stroke-width: 0.3px;
          stroke-linecap: round;
          fill: none;
        }

        .lineText {
          font-size: 3.5px;
          text-anchor: end;
        }
      `}</style>

      <defs>
        <path id="cc" d="M 0 98 a 98 98 0 1 1 0.1 0 z"/>
        {pois.map(({ id, lat, lng }) => {
          const b = Math.PI + bearing(toRad(baseLat), toRad(baseLng), toRad(lat), toRad(lng));
          return <path id={`p${id}`} key={id} d={`M ${Math.sin(b) * innerRadius} ${Math.cos(b) * innerRadius} L ${Math.sin(b) * outerRadius} ${Math.cos(b) * outerRadius}`}/>;
        })}
      </defs>

      <use xlinkHref="#cc" className="line"/>

      <text x="0" y="0" dy="5.5" className="lineText">
        <textPath xlinkHref="#cc" startOffset="37.5%" textAnchor="middle">© OpenStreetMap contributors</textPath>
        <textPath xlinkHref="#cc" startOffset="0%" textAnchor="middle">S</textPath>
        <textPath xlinkHref="#cc" startOffset="25%" textAnchor="middle">W</textPath>
        <textPath xlinkHref="#cc" startOffset="50%" textAnchor="middle">N</textPath>
        <textPath xlinkHref="#cc" startOffset="75%" textAnchor="middle">E</textPath>
      </text>

      {pois.map(({ id }) => <use key={id} xlinkHref={`#p${id}`} className="line"/>)}

      {
        pois.map(({ id, lat, lng, text }) => (
          <text key={id} x="-3" y="100" dy="-2" className="lineText">
            <textPath xlinkHref={`#p${id}`} startOffset="100%">
              {text.replace('{d}', Math.round(L.latLng(lat, lng).distanceTo(L.latLng(baseLat, baseLng)) / 100) / 10)}
            </textPath>
          </text>
        ))
      }

      <circle cx="0" cy="0" r={outerRadius} className="line"/>
      <circle cx="0" cy="0" r={innerRadius} className="line"/>
    </svg>
  );
}

Toposcope.propTypes = {
  baseLat: React.PropTypes.number.isRequired,
  baseLng: React.PropTypes.number.isRequired,
  innerRadius: React.PropTypes.number,
  outerRadius: React.PropTypes.number,
  pois: React.PropTypes.array.isRequired
};

const PI2 = 2 * Math.PI;

function bearing(lat1, lng1, lat2, lng2) {
  const dLon = (lng2 - lng1);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return PI2 - ((Math.atan2(y, x) + PI2) % PI2);
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

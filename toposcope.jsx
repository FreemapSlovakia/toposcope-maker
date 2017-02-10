const React = require('react');

module.exports = Toposcope;

function Toposcope({ baseLat, baseLng, peaks }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="-100 -100 200 200">
      <defs>
        {peaks.map(({ id, lat, lon }) => {
          const b = Math.PI + bearing(toRad(baseLat), toRad(baseLng), toRad(lat), toRad(lon));
          return <path id={`p${id}`} key={id} d={`M ${Math.sin(b) * 15} ${Math.cos(b) * 15} L ${Math.sin(b) * 90} ${Math.cos(b) * 90}`}/>;
        })}
      </defs>

      {peaks.map(({ id }) => <use key={id} xlinkHref={`#p${id}`} className="line"/>)}

      {
        peaks.map(({ id, lat, lon, tags: { name, ele } }) => (
          <text key={id} x="-3" y="100" dy="-2" className="lineText">
            <textPath xlinkHref={`#p${id}`} startOffset="100%">{name} {ele} m, {Math.round(L.latLng(lat, lon).distanceTo(L.latLng(baseLat, baseLng)) / 100) / 10} km</textPath>
          </text>
        ))
      }

      <circle cx="0" cy="0" r="90" className="line"/>
      <circle cx="0" cy="0" r="15" className="line"/>
    </svg>
  );
}

Toposcope.propTypes = {
  baseLat: React.PropTypes.number.isRequired,
  baseLng: React.PropTypes.number.isRequired,
  peaks: React.PropTypes.array.isRequired
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

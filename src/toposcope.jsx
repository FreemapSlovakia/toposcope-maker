const React = require('react');

module.exports = Toposcope;

function Toposcope({ pois, innerRadius = 25, outerRadius = 90, messages, inscriptions }) {
  const t = key => messages[key] || key;
  const observerPoi = pois.find(({ observer }) => observer);
  const poisAround = pois.filter(poi => poi !== observerPoi);

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
          font-family: Arial;
          font-size: 3.5px;
          text-anchor: end;
        }
      `}</style>

      <defs>
        {poisAround.map(({ id, lat, lng }) => {
          const b = Math.PI + bearing(toRad(observerPoi.lat), toRad(observerPoi.lng), toRad(lat), toRad(lng));
          return <path id={`p${id}`} key={id} d={`M ${Math.sin(b) * innerRadius} ${Math.cos(b) * innerRadius} L ${Math.sin(b) * outerRadius} ${Math.cos(b) * outerRadius}`}/>;
        })}
      </defs>

      <path id="outerCircle" d="M 99,0 A 99,99 0 0 1 0,99 99,99 0 0 1 -99,0 99,99 0 0 1 0,-99 99,99 0 0 1 99,0 Z" className="line"/>

      {inscriptions.map((inscription, i) =>
        <text dy="6.0" className="lineText" key={i}>
          <textPath xlinkHref="#outerCircle" startOffset={i * 25 + 12.5 + '%'} textAnchor="middle">{inscription.replace('{a}', t('osmAttribution'))}</textPath>
        </text>
      )}

      {[ t('east'), t('south'), t('west'), t('north') ].map((x, i) =>
        <text key={i} dy="6" className="lineText">
          <textPath xlinkHref="#outerCircle" startOffset={`${i * 25}%`} textAnchor="middle">{x}</textPath>
        </text>
      )}

      {poisAround.map(({ id }) => <use key={id} xlinkHref={`#p${id}`} className="line"/>)}

      {
        poisAround.map(({ id, lat, lng, text }) => (
          <text key={id} className="lineText">
            <textPath xlinkHref={`#p${id}`} startOffset="100%">
              <tspan dy="-2" xmlSpace="preserve">
                {text.replace('{d}', Math.round(L.latLng(lat, lng).distanceTo(L.latLng(observerPoi.lat, observerPoi.lng)) / 100) / 10) + '   '}
              </tspan>
            </textPath>
          </text>
        ))
      }

      <circle cx="0" cy="0" r={outerRadius} className="line"/>
      <circle cx="0" cy="0" r={innerRadius} className="line"/>

    <text x="0" y={observerPoi.text ? '-3.5em' : '-2.5em'} className="lineText">
      {observerPoi.text && <tspan textAnchor="middle" x="0" dy="2em">{observerPoi.text}</tspan>}
      <tspan textAnchor="middle" x="0" dy="2em">{(observerPoi.lat > 0 ? 'N' : 'S') + ' ' + formatGpsCoord(Math.abs(observerPoi.lat))}</tspan>
      <tspan textAnchor="middle" x="0" dy="2em">{(observerPoi.lng < 0 ? 'W' : 'E') + ' ' + formatGpsCoord(Math.abs(observerPoi.lng))}</tspan>
    </text>
    </svg>
  );
}

function formatGpsCoord(angle) {
  const degrees = Math.floor(angle);
  const minutes = Math.floor((angle - degrees) * 60);
  const seconds = Math.round((angle - degrees - minutes / 60) * 3600);
  return `${degrees}° ${minutes}' ${seconds}"`;
}

Toposcope.propTypes = {
  innerRadius: React.PropTypes.number,
  outerRadius: React.PropTypes.number,
  inscriptions: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  messages: React.PropTypes.object.isRequired,
  pois: React.PropTypes.array.isRequired,
  title: React.PropTypes.string
};

const PI2 = 2 * Math.PI;

function bearing(lat1, lng1, lat2, lng2) {
  const dLon = lng2 - lng1;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return PI2 - ((Math.atan2(y, x) + PI2) % PI2);
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

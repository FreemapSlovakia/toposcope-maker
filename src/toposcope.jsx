import React from 'react';

export default function Toposcope({ pois, innerRadius = 25, outerRadius = 90, messages, inscriptions, language, fontSize, preventUpturnedText, onClick }) {
  const t = key => messages[key] || key;
  const observerPoi = pois.find(({ observer }) => observer);
  const poisAround = pois.filter(poi => poi !== observerPoi).map(poi => Object.assign({}, poi));
  const nf = typeof Intl !== 'undefined' ? new Intl.NumberFormat(language, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : null;

  function formatDistance(d) {
    return nf ? nf.format(d / 1000) : (Math.round(d / 100) / 10);
  }

  const innerTexts = [
    ...observerPoi.text.trim().split('\n'),
    (observerPoi.lat > 0 ? 'N' : 'S') + ' ' + formatGpsCoord(Math.abs(observerPoi.lat)),
    (observerPoi.lng < 0 ? 'W' : 'E') + ' ' + formatGpsCoord(Math.abs(observerPoi.lng))
  ].filter(line => line.trim().length);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
      <style>{`
        .line {
          stroke: #000000;
          stroke-width: 0.3;
          stroke-linecap: round;
          fill: none;
        }

        .lineText {
          font-family: Arial;
          font-size: ${fontSize}px;
        }
      `}</style>

      <defs>
        {poisAround.map(poi => {
          const { id, lat, lng } = poi;
          const b = Math.PI + bearing(toRad(observerPoi.lat), toRad(observerPoi.lng), toRad(lat), toRad(lng));
          let p1 = `${Math.sin(b) * innerRadius} ${Math.cos(b) * innerRadius}`;
          let p2 = `${Math.sin(b) * outerRadius} ${Math.cos(b) * outerRadius}`;
          if (!(b > 2 * Math.PI) && preventUpturnedText) {
            [ p1, p2 ] = [ p2, p1 ];
            poi.reversed = true;
          }
          return <path id={`p${id}`} key={id} d={`M ${p1} L ${p2}`}/>;
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

      {poisAround.map(({ id }) => <use key={id} xlinkHref={`#p${id}`} className="line clickable" onClick={onClick.bind(null, id)}/>)}

      {
        poisAround.map(({ id, lat, lng, text, reversed }) => {
          const lines = text.replace('{d}', formatDistance(L.latLng(lat, lng).distanceTo(L.latLng(observerPoi.lat, observerPoi.lng)))).split('\n');
          const clickHandler = onClick.bind(null, id);
          return [
            <text key={'x' + id} className="lineText clickable" onClick={clickHandler}>
              <textPath xlinkHref={`#p${id}`} startOffset={reversed ? '0%' : '100%'} textAnchor={reversed ? 'start' : 'end'}>
                <tspan x="0" dy="-2" xmlSpace="preserve">&#160;&#160;&#160;&#160;{lines[0]}&#160;&#160;&#160;&#160;</tspan>
              </textPath>
            </text>,
            lines[1] ? <text key={id} className="lineText clickable" onClick={clickHandler}>
              <textPath xlinkHref={`#p${id}`} startOffset={reversed ? '0%' : '100%'} textAnchor={reversed ? 'start' : 'end'}>
                <tspan x="0" dy="5" xmlSpace="preserve">&#160;&#160;&#160;&#160;{lines[1]}&#160;&#160;&#160;&#160;</tspan>
              </textPath>
            </text> : undefined
          ];
        })
      }

      <circle cx="0" cy="0" r={outerRadius} className="line"/>
      <circle cx="0" cy="0" r={innerRadius} className="line"/>

      <text x="0" y={-1 - innerTexts.length * 3} className="lineText clickable" onClick={onClick.bind(null, observerPoi.id)}>
        {innerTexts.map((line, i) => <tspan key={i} textAnchor="middle" x="0" dy="6">{line}</tspan>)}
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
  fontSize: React.PropTypes.number,
  inscriptions: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
  messages: React.PropTypes.object.isRequired,
  pois: React.PropTypes.array.isRequired,
  title: React.PropTypes.string,
  language: React.PropTypes.string.isRequired,
  preventUpturnedText: React.PropTypes.bool,
  onClick: React.PropTypes.func
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

const React = require('react');
const ReactDOM = require('react-dom');
const { Map, TileLayer, Marker, Popup } = require('react-leaflet');

function createIcon(color) {
  return L.divIcon({html: `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
  	 viewBox="0 0 365 560" enable-background="new 0 0 365 560" xml:space="preserve">
  <g>
  	<path fill="${color}" stroke="black" stroke-width="20" stroke-linecap="butt" d="M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9
  		C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8
  		c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z"/>
  </g>
  </svg>`, iconAnchor: [10, 30], iconSize: [20, 20]});
}

const placeIcon = createIcon('red');
const peakIcon = createIcon('#ddf');
const activePeakIcon = createIcon('#66f');

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      center: L.latLng(48.8, 19),
      peaks: [],
      freeze: false
    };
  }

  handleLoad() {
    const { lat, lng } = this.state.center;

    this.setState({ freeze: true });

    const query = `[out:json][timeout:25]; ( node["natural"="peak"] (around:3000,${lat},${lng}); ); out body; >; out skel qt;`;

    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query)
    }).then(res => res.json()).then(data => {
      this.setState({
        peaks: data.elements.filter(({ tags: name }) => name)
      });
    });
  }

  handleMapMove(e) {
    if (!this.state.freeze) {
      this.setState({ center: e.target.getCenter() });
    }
  }

  handlePeakClick(id) {
    this.setState({
      peaks: this.state.peaks.map(peak => peak.id === id ? Object.assign({}, peak, { active: !peak.active }) : peak)
    });
  }

  render() {
    const position = [48.8, 19];
    return (
      <div>
        <Map style={{ width: '100%', height: '800px' }} center={position} zoom={9} onMove={this.handleMapMove.bind(this)}>
          <TileLayer url="http://{s}.freemap.sk/T/{z}/{x}/{y}.png"/>
          <Marker position={this.state.center} icon={placeIcon}/>

          {this.state.peaks.map(({ id, lat, lon, active }) =>
            <Marker key={id} position={[ lat, lon ]} onClick={this.handlePeakClick.bind(this, id)} icon={active ? activePeakIcon : peakIcon}/>
          )}
        </Map>

        <button onClick={this.handleLoad.bind(this)}>Load</button>

          <div>
            <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="-100 -100 200 200">
              <defs>
                {this.state.peaks.map(({ id, lat, lon }) => {
                  const b = Math.PI + bearing(this.state.center.lat, this.state.center.lng, lat, lon);
                  return <path id={`p${id}`} key={id} d={`M ${Math.sin(b) * 15} ${Math.cos(b) * 15} L ${Math.sin(b) * 90} ${Math.cos(b) * 90}`}/>;
                })}
              </defs>

              {this.state.peaks.map(({ id }) => <use key={id} xlinkHref={`#p${id}`} className="line"/>)}

              {
                  this.state.peaks.map(({ id, lat, lon, tags: { name, ele } }) => (
                    <text key={id} x="-3" y="100" dy="-2" className="lineText">
                      <textPath xlinkHref={`#p${id}`} startOffset="100%">{name} {ele} m, {Math.round(L.latLng(lat, lon).distanceTo(L.latLng(this.state.center.lat, this.state.center.lng)) / 100) / 10} km</textPath>
                    </text>
                  ))
              }

              <circle cx="0" cy="0" r="90" className="line"/>
              <circle cx="0" cy="0" r="15" className="line"/>
            </svg>
          </div>

      </div>
    );
  }

}

ReactDOM.render(<Main/>, document.getElementById('main'));



function bearing(lat1, lng1, lat2, lng2) {
    lat1 = toRad(lat1);
    lng1 = toRad(lng1);
    lat2 = toRad(lat2);
    lng2 = toRad(lng2);
    var dLon = (lng2 - lng1);
    var y = Math.sin(dLon) * Math.cos(lat2);
    var x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    var brng = toDeg(Math.atan2(y, x));
    return toRad(360 - ((brng + 360) % 360));
}

function toRad(deg) {
  return deg * Math.PI / 180;
}

function toDeg(rad) {
  return rad * 180 / Math.PI;
}

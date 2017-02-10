const React = require('react');
const ReactDOM = require('react-dom');
const { Map, TileLayer, Marker } = require('react-leaflet');
const Toposcope = require('./toposcope.jsx');
const createMarker = require('./markers.js');
const loadPeaks = require('./poiLoader.js');

const placeIcon = createMarker('red');
const peakIcon = createMarker('#ddf');
const activePeakIcon = createMarker('#66f');

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
    loadPeaks(lat, lng).then(peaks => this.setState({ peaks }));
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
    const { center, peaks } = this.state;
    return (
      <div>
        <div className="grid">
          <div className="col-1-2">
            <Map style={{ width: '100%', height: '500px' }} center={position} zoom={9} onMove={this.handleMapMove.bind(this)}>
              <TileLayer url="http://{s}.freemap.sk/T/{z}/{x}/{y}.png"/>
              <Marker position={center} icon={placeIcon}/>

              {peaks.map(({ id, lat, lon, active }) =>
                <Marker key={id} position={[ lat, lon ]} onClick={this.handlePeakClick.bind(this, id)} icon={active ? activePeakIcon : peakIcon}/>
              )}
            </Map>
          </div>
          <div className="col-1-2">
            <button onClick={this.handleLoad.bind(this)}>Load</button>
          </div>
        </div>

        <div className="grid">
          <div className="col-1-1">
            <Toposcope baseLat={center.lat} baseLng={center.lng} peaks={peaks}/>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById('main'));

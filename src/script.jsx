const React = require('react');
const ReactDOM = require('react-dom');
const { Map, TileLayer, Marker } = require('react-leaflet');
const Toposcope = require('./toposcope.jsx');
const createMarker = require('./markers.js');
const loadPeaks = require('./poiLoader.js');
const FileSaver = require('file-saver');

const placeIcon = createMarker('red');
const poiIcon = createMarker('#ddf');
const activePoiIcon = createMarker('#66f');

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      center: L.latLng(48.8, 19),
      pois: [],
      mode: '',
      activePoiId: null
    };

    this.nextId = -1;
  }

  handleLoad() {
    const { lat, lng } = this.state.center;
    let radius = window.prompt('Radius in meters? Must be less than 20000.', 1000);
    radius = parseFloat(radius);
    if (radius > 0 && radius <= 20000) {
      loadPeaks(lat, lng, radius).then(pois => this.setState({ pois: [ ...this.state.pois.filter(({ id1 }) => pois.find(({ id2 }) => id1 !== id2) !== -1), ...pois ] }));
    }
  }

  handleMapMove(e) {
    this.setState({ center: e.target.getCenter() });
  }

  handlePoiClick(activePoiId) {
    if (this.state.mode === 'delete_poi') {
      this.setState({ activePoiId: null, pois: [ ...this.state.pois.filter(({ id }) => id !== activePoiId) ] });
    } else {
      this.setState({ activePoiId });
    }
  }

  handleMapClick(e) {
    if (this.state.mode === 'add_poi') {
      this.setState({
        activePoiId: null,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '', id: this.nextId++ } ]
      });
    } else {
      this.setState({ activePoiId: null, });
    }
  }

  handleTextChange(e) {
    const activePoi = this.state.pois.find(({ id }) => id === this.state.activePoiId);
    if (activePoi) {
      this.setState({ pois: [
        ...this.state.pois.filter(poi => poi !== activePoi),
        Object.assign({}, activePoi, { text: e.target.value })
      ] });
    }
  }

  handleAddPois() {
    this.setState({ mode: this.state.mode === 'add_poi' ? '' : 'add_poi' });
  }

  handleDeletePois() {
    this.setState({ mode: this.state.mode === 'delete_poi' ? '' : 'delete_poi' });
  }

  handleModeMove() {
    this.setState({ mode: this.state.mode === 'move_poi' ? '' : 'move_poi' });
  }

  handlePoiDrag(id2, e) {
    const activePoi = this.state.pois.find(({ id }) => id === id2);
    this.setState({ pois: [
      ...this.state.pois.filter(poi => poi !== activePoi),
      Object.assign({}, activePoi, { lat: e.latlng.lat, lng: e.latlng.lng })
    ] });
  }

  handleSave() {
    FileSaver.saveAs(new Blob([ this.refs.toposcope.innerHTML ], { type: 'image/svg+xml' }), 'topograph.svg');
  }

  render() {
    const position = [48.8, 19];
    const { center, pois, activePoiId, mode } = this.state;
    const activePoi = pois.find(({ id }) => id === activePoiId);

    return (
      <div>
        <div className="grid">
          <div className="col-1-2">
            <Map style={{ width: '100%', height: '500px' }} center={position} zoom={9} onMove={this.handleMapMove.bind(this)} onClick={this.handleMapClick.bind(this)}>
              <TileLayer url="http://{s}.freemap.sk/T/{z}/{x}/{y}.png"/>
              <Marker position={center} icon={placeIcon}/>

              {pois.map(({ id, lat, lng }) =>
                <Marker key={id} position={[ lat, lng ]}
                  onClick={this.handlePoiClick.bind(this, id)}
                  icon={id === activePoiId ? activePoiIcon : poiIcon}
                  onDrag={this.handlePoiDrag.bind(this, id)}
                  draggable={mode === 'move_poi'}/>
              )}
            </Map>
          </div>
          <div className="col-1-2">
            <button onClick={this.handleLoad.bind(this)}>Load Peaks</button>
            <button className={ mode === 'move_poi' ? 'active' : '' } onClick={this.handleModeMove.bind(this)}>Move</button>
            <button className={ mode === 'add_poi' ? 'active' : '' } onClick={this.handleAddPois.bind(this)}>Add</button>
            <button className={ mode === 'delete_poi' ? 'active' : '' } onClick={this.handleDeletePois.bind(this)}>Delete</button>
            {activePoi &&
              <input type="text" value={activePoi.text} onChange={this.handleTextChange.bind(this)}/>
            }
            <button onClick={this.handleSave.bind(this)}>Save Toposcope</button>
          </div>
        </div>

        <div className="grid">
          <div className="col-1-1" ref="toposcope">
            <Toposcope baseLat={center.lat} baseLng={center.lng} pois={pois}/>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById('main'));

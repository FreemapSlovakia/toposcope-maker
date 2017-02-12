const React = require('react');
const ReactDOM = require('react-dom');
const { Map, TileLayer, Marker } = require('react-leaflet');
const Toposcope = require('./toposcope.jsx');
const createMarker = require('./markers.js');
const loadPeaks = require('./poiLoader.js');
const FileSaver = require('file-saver');
const Navbar = require('react-bootstrap/lib/Navbar');
const Nav = require('react-bootstrap/lib/Nav');
const NavItem = require('react-bootstrap/lib/NavItem');
const FormGroup = require('react-bootstrap/lib/FormGroup');
const ControlLabel = require('react-bootstrap/lib/ControlLabel');
const FormControl = require('react-bootstrap/lib/FormControl');

const poiIcon = createMarker('#ddf');
const placeIcon = createMarker('red');
const activePoiIcon = createMarker('#66f');

class Main extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      center: L.latLng(48.8, 19),
      viewer: null,
      pois: [],
      mode: '',
      activePoiId: null
    };

    this.nextId = -1;
  }

  handleMapMove(e) {
    this.setState({ center: e.target.getCenter() });
  }

  handlePoiClick(poiId) {
    if (poiId === 'viewer') {
      if (this.state.mode === 'delete_poi') {
        this.setState({ viewer: null });
      }
    } else if (this.state.mode === 'delete_poi') {
      this.setState({ activePoiId: null, pois: [ ...this.state.pois.filter(({ id }) => id !== poiId) ] });
    } else {
      this.setState({ activePoiId: poiId });
    }
  }

  handleMapClick(e) {
    if (this.state.mode === 'add_poi') {
      this.setState({
        activePoiId: null,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '', id: this.nextId++ } ]
      });
    } else if (this.state.mode === 'set_viewer') {
      this.setState({ viewer: e.latlng });
    } else if (this.state.mode === 'load_peaks') {
      const { lat, lng } = e.latlng;
      let radius = window.prompt('Radius in meters? Must be less than 20000.', 1000);
      radius = parseFloat(radius);
      if (radius > 0 && radius <= 20000) {
        loadPeaks(lat, lng, radius).then(pois => this.setState({ pois: [ ...this.state.pois.filter(({ id1 }) => pois.find(({ id2 }) => id1 !== id2) !== -1), ...pois ] }));
      }
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

  handlePoiDrag(poiId, e) {
    if (poiId === 'viewer') {
      this.setState({ viewer: e.latlng });
    } else {
      const activePoi = this.state.pois.find(({ id }) => id === poiId);
      this.setState({ pois: [
        ...this.state.pois.filter(poi => poi !== activePoi),
        Object.assign({}, activePoi, { lat: e.latlng.lat, lng: e.latlng.lng })
      ] });
    }
  }

  handleSave() {
    FileSaver.saveAs(new Blob([ this.refs.toposcope.innerHTML ], { type: 'image/svg+xml' }), 'topograph.svg');
  }

  handleSetMode(mode, e) {
    this.setState({ mode: this.state.mode === mode ? '' : mode });
    e.preventDefault();
  }

  render() {
    const position = [48.8, 19];
    const { viewer, pois, activePoiId, mode } = this.state;
    const activePoi = pois.find(({ id }) => id === activePoiId);

    return (
      <div>
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>Toposcope Maker</Navbar.Brand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <NavItem active={mode === 'set_viewer'} onClick={this.handleSetMode.bind(this, 'set_viewer')}>Place Observer</NavItem>
              <NavItem active={mode === 'load_peaks'} onClick={this.handleSetMode.bind(this, 'load_peaks')}>Load Peaks</NavItem>
              <NavItem active={mode === 'add_poi'} onClick={this.handleSetMode.bind(this, 'add_poi')}>Add POI</NavItem>
              <NavItem active={mode === 'move_poi'} onClick={this.handleSetMode.bind(this, 'move_poi')}>Move</NavItem>
              <NavItem active={mode === 'delete_poi'} onClick={this.handleSetMode.bind(this, 'delete_poi')}>Delete</NavItem>
              <NavItem onClick={this.handleSave.bind(this)} disabled={!viewer}>Save Toposcope</NavItem>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <Map style={{ width: '100%', height: '500px' }} center={position} zoom={9} onMove={this.handleMapMove.bind(this)} onClick={this.handleMapClick.bind(this)}>
                <TileLayer url="http://{s}.freemap.sk/T/{z}/{x}/{y}.png"/>
                {viewer &&
                  <Marker position={viewer} icon={placeIcon}
                    draggable={mode === 'move_poi'}
                    onClick={this.handlePoiClick.bind(this, 'viewer')}
                    onDrag={this.handlePoiDrag.bind(this, 'viewer')}
                  />
                }

                {pois.map(({ id, lat, lng }) =>
                  <Marker key={id} position={[ lat, lng ]}
                    onClick={this.handlePoiClick.bind(this, id)}
                    onDrag={this.handlePoiDrag.bind(this, id)}
                    icon={id === activePoiId ? activePoiIcon : poiIcon}
                    draggable={mode === 'move_poi'}/>
                )}
              </Map>
            </div>
            <div className="col-md-6" ref="toposcope">
              {viewer && <Toposcope baseLat={viewer.lat} baseLng={viewer.lng} pois={pois}/>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <div className="btn-group">
              </div>
              {' '}
              {activePoi &&
                <FormGroup>
                  <ControlLabel>Label</ControlLabel>
                  <FormControl type="text" value={activePoi.text} onChange={this.handleTextChange.bind(this)}/>
                </FormGroup>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Main/>, document.getElementById('main'));

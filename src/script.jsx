const React = require('react');
const ReactDOM = require('react-dom');
const { Map, TileLayer, Marker, LayersControl } = require('react-leaflet');
const Toposcope = require('./toposcope.jsx');
const Help = require('./help.jsx');
const Hourglass = require('./hourglass.jsx');
const createMarker = require('./markers.js');
const loadPeaks = require('./poiLoader.js');
const FileSaver = require('file-saver');
const Navbar = require('react-bootstrap/lib/Navbar');
const Nav = require('react-bootstrap/lib/Nav');
const NavItem = require('react-bootstrap/lib/NavItem');
const FormGroup = require('react-bootstrap/lib/FormGroup');
const ControlLabel = require('react-bootstrap/lib/ControlLabel');
const FormControl = require('react-bootstrap/lib/FormControl');
const NavDropdown = require('react-bootstrap/lib/NavDropdown');
const MenuItem = require('react-bootstrap/lib/MenuItem');

const poiIcon = createMarker('#ddf');
const placeIcon = createMarker('red');
const activePoiIcon = createMarker('#66f');

const mapDefinitions = require('./mapDefinitions');

class Main extends React.Component {

  constructor(props) {
    super(props);

    const toposcope = JSON.parse(localStorage.getItem('toposcope'));
    const language = toposcope && toposcope.language ||
      navigator.languages.map(language => language.split('-')[0]).find(language => language === 'en' || language === 'sk')

    this.state = {
      map: 'OpenStreetMap Mapnik',
      center: L.latLng(48.8, 19),
      zoom: 9,
      viewer: null,
      pois: [],
      mode: '',
      activePoiId: null,
      fetching: false,
      language,
      inscriptions: [ '', '{a}', '', '' ],
      messages: readMessages(language),
      showHelp: false
    };

    if (toposcope) {
      Object.assign(this.state, toposcope);
    }

    this.nextId = this.state.pois.reduce((a, { id }) => Math.min(a, id), 0) - 1;
  }

  componentDidUpdate() {
    const toSave = Object.assign({}, this.state);
    delete toSave.messages;
    delete toSave.fetching;
    delete toSave.showHelp;
    localStorage.setItem('toposcope', JSON.stringify(toSave));
  }

  handleMapMove(e) {
    this.setState({ center: e.target.getCenter() });
  }

  handleMapZoom(e) {
    this.setState({ zoom: e.target.getZoom() });
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
        activePoiId: this.nextId,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '', id: this.nextId } ]
      });
      this.nextId--;
    } else if (this.state.mode === 'set_viewer') {
      this.setState({ viewer: e.latlng, activePoiId: null });
    } else if (this.state.mode === 'load_peaks') {
      const { lat, lng } = e.latlng;
      let radius = window.prompt(this.state.messages['loadPeaksPrompt'], 1000);
      radius = parseFloat(radius);
      if (radius > 0 && radius <= 20000) {
        this.setState({ fetching: true });
        loadPeaks(lat, lng, radius).then(pois => {
          this.setState({ activePoiId: null,
            pois: [ ...this.state.pois.filter(({ id1 }) => pois.find(({ id2 }) => id1 !== id2) !== -1), ...pois ] });
        }).catch().then(() => this.setState({ fetching: false }));
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
    FileSaver.saveAs(new Blob([ this.refs.toposcope.innerHTML ], { type: 'image/svg+xml' }), 'toposcope.svg');
  }

  handleSetMode(mode, e) {
    this.setState({ mode: this.state.mode === mode ? '' : mode });
    e.preventDefault();
  }

  handleMapChange(map) {
    this.setState({ map });
  }

  handleSetLanguage(language) {
    this.setState({ language, messages: readMessages(language) });
  }

  handleCustomTextChange(i, e) {
    const inscriptions = [ ...this.state.inscriptions ];
    inscriptions[i] = e.target.value;
    this.setState({ inscriptions });
  }

  handleShowHelp() {
    this.setState({ showHelp: true });
  }

  handleHideHelp() {
    this.setState({ showHelp: false });
  }

  render() {
    const { viewer, pois, activePoiId, mode, fetching, center, zoom, map, messages, language, inscriptions, showHelp } = this.state;
    const activePoi = pois.find(({ id }) => id === activePoiId);
    const t = key => messages[key] || key;

    return (
      <Hourglass active={fetching}>
        <Help onClose={this.handleHideHelp.bind(this)} show={showHelp} messages={messages}/>

        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>Toposcope Maker</Navbar.Brand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <NavItem active={mode === 'set_viewer'} onClick={this.handleSetMode.bind(this, 'set_viewer')}>{t('placeObserver')}</NavItem>
              <NavItem active={mode === 'load_peaks'} onClick={this.handleSetMode.bind(this, 'load_peaks')}>{t('loadPeaks')}</NavItem>
              <NavItem active={mode === 'add_poi'} onClick={this.handleSetMode.bind(this, 'add_poi')}>{t('addPoi')}</NavItem>
              <NavItem active={mode === 'move_poi'} onClick={this.handleSetMode.bind(this, 'move_poi')}>{t('move')}</NavItem>
              <NavItem active={mode === 'delete_poi'} onClick={this.handleSetMode.bind(this, 'delete_poi')}>{t('delete')}</NavItem>
              <NavItem onClick={this.handleSave.bind(this)} disabled={!viewer}>{t('saveToposcope')}</NavItem>
              <NavItem onClick={this.handleShowHelp.bind(this)}>{t('help')}</NavItem>
              <NavDropdown title={t('language')} id="basic-nav-dropdown">
                <MenuItem onClick={this.handleSetLanguage.bind(this, 'en')}>English{language === 'en' ? ' ✓' : ''}</MenuItem>
                <MenuItem onClick={this.handleSetLanguage.bind(this, 'sk')}>Slovensky{language === 'sk' ? ' ✓' : ''}</MenuItem>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <Map style={{ width: '100%', height: '500px' }} center={center} zoom={zoom}
                  onMove={this.handleMapMove.bind(this)}
                  onClick={this.handleMapClick.bind(this)}
                  onZoom={this.handleMapZoom.bind(this)}>

                <LayersControl position="topright">
                  {
                    mapDefinitions.map(({ name, url, attribution, maxZoom, minZoom }) =>
                      <LayersControl.BaseLayer key={name} name={name} checked={map === name}>
                        <TileLayer attribution={attribution} url={url} onAdd={this.handleMapChange.bind(this, name)}
                          maxZoom={maxZoom} minZoom={minZoom}/>
                      </LayersControl.BaseLayer>
                    )
                  }
                </LayersControl>

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
              {viewer && <Toposcope baseLat={viewer.lat} baseLng={viewer.lng} pois={pois} messages={messages} inscriptions={inscriptions}/>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              {[ [ 'south', 'east' ], [ 'south', 'west' ], [ 'north', 'west' ], [ 'north', 'east' ] ].map(([ c1, c2 ], i) =>
                <FormGroup key={i}>
                  <ControlLabel>{t('inscription')} {t(c1)}–{t(c2)}</ControlLabel>
                  <FormControl type="text" value={inscriptions[i]} onChange={this.handleCustomTextChange.bind(this, i)}/>
                </FormGroup>
              )}
            </div>
            <div className="col-md-6">
              {activePoi &&
                <FormGroup>
                  <ControlLabel>{t('label')}</ControlLabel>
                  <FormControl type="text" value={activePoi.text} onChange={this.handleTextChange.bind(this)} placeholder={t('labelPlaceholder')}/>
                </FormGroup>
              }
            </div>
          </div>
        </div>
      </Hourglass>
    );
  }
}

function readMessages(language) {
  const messages = require(`./${language}.json`);
  Object.keys(messages).forEach(function (key) {
    const message = messages[key];
    if (Array.isArray(message)) {
      messages[key] = message.join('\n');
    }
  });
  return messages;
}

ReactDOM.render(<Main/>, document.getElementById('main'));

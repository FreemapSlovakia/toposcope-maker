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
const Checkbox = require('react-bootstrap/lib/Checkbox');

const poiIcon = createMarker('#ddf');
const observerIcon = createMarker('#f88');
const activeObserverIcon = createMarker('#f00');
const activePoiIcon = createMarker('#66f');

const mapDefinitions = require('./mapDefinitions');

const localStorageName = 'toposcope1';

class Main extends React.Component {

  constructor(props) {
    super(props);

    const toposcope = JSON.parse(localStorage.getItem(localStorageName));
    const language = toposcope && toposcope.language ||
      navigator.languages.map(language => language.split('-')[0]).find(language => language === 'en' || language === 'sk')

    this.state = {
      map: 'OpenStreetMap Mapnik',
      center: L.latLng(48.8, 19),
      zoom: 9,
      pois: [],
      mode: '',
      activePoiId: null,
      fetching: false,
      language,
      inscriptions: [ '', '{a}', '', '' ],
      messages: readMessages(language),
      showHelp: false,
      innerCircleRadius: 25,
      loadPoiMaxDistance: 1000
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
    localStorage.setItem(localStorageName, JSON.stringify(toSave));
  }

  handleMapMove(e) {
    this.setState({ center: e.target.getCenter() });
  }

  handleMapZoom(e) {
    this.setState({ zoom: e.target.getZoom() });
  }

  handlePoiClick(poiId) {
    if (this.state.mode === 'delete_poi') {
      this.setState({ activePoiId: null, pois: [ ...this.state.pois.filter(({ id }) => id !== poiId) ] });
    } else {
      this.setState({ activePoiId: poiId });
    }
  }

  handleMapClick(e) {
    if (this.state.mode === 'add_poi') {
      this.setState({
        activePoiId: this.nextId,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '', id: this.nextId, observer: false } ]
      });
      this.nextId--;
    } else if (this.state.mode === 'load_peaks') {
      const { lat, lng } = e.latlng;
      const radius = parseFloat(this.state.loadPoiMaxDistance);
      this.setState({ fetching: true });
      loadPeaks(lat, lng, !isNaN(radius) && radius > 0 && radius <= 20000 ? radius : 1000).then(pois => {
        this.setState({ activePoiId: null,
          pois: [ ...this.state.pois.filter(({ id1 }) => pois.find(({ id2 }) => id1 !== id2) !== -1), ...pois ] });
      }).catch().then(() => this.setState({ fetching: false }));
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
    const activePoi = this.state.pois.find(({ id }) => id === poiId);
    this.setState({ pois: [
      ...this.state.pois.filter(poi => poi !== activePoi),
      Object.assign({}, activePoi, { lat: e.latlng.lat, lng: e.latlng.lng })
    ] });
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

  handleObserverChange() {
    const activePoi = this.state.pois.find(({ id }) => id === this.state.activePoiId);
    this.setState({ pois: [
      ...this.state.pois.filter(poi => poi !== activePoi).map(poi => Object.assign({}, poi, { observer: false })),
      Object.assign({}, activePoi, { observer: !activePoi.observer })
    ] });
  }

  handleInnerCircleRadiusChange(e) {
    this.setState({ innerCircleRadius: e.target.value });
  }

  handleLoadPoiMaxDistanceChange(e) {
    this.setState({ loadPoiMaxDistance: e.target.value });
  }

  render() {
    const { pois, activePoiId, mode, fetching, center, zoom, map, messages, language,
      inscriptions, showHelp, innerCircleRadius, loadPoiMaxDistance } = this.state;
    const activePoi = pois.find(({ id }) => id === activePoiId);
    const observerPoi = pois.find(({ observer }) => observer);
    const t = key => messages[key] || key;
    const icr = parseFloat(innerCircleRadius);

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
              <NavItem active={mode === 'add_poi'} onClick={this.handleSetMode.bind(this, 'add_poi')}>{t('addPoi')}</NavItem>
              <NavItem active={mode === 'load_peaks'} onClick={this.handleSetMode.bind(this, 'load_peaks')}>{t('loadPeaks')}</NavItem>
              <NavItem active={mode === 'move_poi'} onClick={this.handleSetMode.bind(this, 'move_poi')}>{t('move')}</NavItem>
              <NavItem active={mode === 'delete_poi'} onClick={this.handleSetMode.bind(this, 'delete_poi')}>{t('delete')}</NavItem>
              <NavItem onClick={this.handleSave.bind(this)} disabled={!observerPoi}>{t('saveToposcope')}</NavItem>
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

                {pois.map(({ id, lat, lng, observer }) =>
                  <Marker key={id} position={[ lat, lng ]}
                    onClick={this.handlePoiClick.bind(this, id)}
                    onDrag={this.handlePoiDrag.bind(this, id)}
                    icon={observer ? (id === activePoiId ? activeObserverIcon : observerIcon) : id === activePoiId ? activePoiIcon : poiIcon}
                    draggable={mode === 'move_poi'}/>
                )}
              </Map>
            </div>
            <div className="col-md-6" ref="toposcope">
              {observerPoi && <Toposcope pois={pois} messages={messages} inscriptions={inscriptions}
                innerRadius={!isNaN(icr) && icr > 0 && icr <= 80 ? icr : 25}/>}
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              {[ [ 'south', 'east' ], [ 'south', 'west' ], [ 'north', 'west' ], [ 'north', 'east' ] ].map(([ c1, c2 ], i) =>
                <FormGroup key={i}>
                  <ControlLabel>{t('inscription')} {t(c1)}–{t(c2)}</ControlLabel>
                  <FormControl type="text" value={inscriptions[i]} onChange={this.handleCustomTextChange.bind(this, i)}/>
                </FormGroup>
              )}
            </div>
            <div className="col-md-4">
              <FormGroup>
                <ControlLabel>{t('innerCircleRadius')}</ControlLabel>
                <FormControl type="number" min="0" max="80" value={innerCircleRadius} onChange={this.handleInnerCircleRadiusChange.bind(this)}/>
              </FormGroup>
              <FormGroup>
                <ControlLabel>{t('loadPoiMaxDistance')}</ControlLabel>
                <FormControl type="number" min="1" max="20000" value={loadPoiMaxDistance} onChange={this.handleLoadPoiMaxDistanceChange.bind(this)}/>
              </FormGroup>
            </div>
            <div className="col-md-4">
              {activePoi &&
                <div>
                  <FormGroup>
                    <ControlLabel>{t('label')}</ControlLabel>
                    <FormControl type="text" value={activePoi.text} onChange={this.handleTextChange.bind(this)} placeholder={t('labelPlaceholder')}/>
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>{t('observer')}</ControlLabel>
                    <Checkbox checked={!!activePoi.observer} onChange={this.handleObserverChange.bind(this)}/>
                  </FormGroup>
                </div>
              }
            </div>
          </div>
        </div>
      </Hourglass>
    );
  }
}

function readMessages(language) {
  const messages = require(`../i18n/${language}.json`);
  Object.keys(messages).forEach(function (key) {
    const message = messages[key];
    if (Array.isArray(message)) {
      messages[key] = message.join('\n');
    }
  });
  return messages;
}

ReactDOM.render(<Main/>, document.getElementById('main'));

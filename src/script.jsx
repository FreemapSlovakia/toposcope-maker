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
const Glyphicon = require('react-bootstrap/lib/Glyphicon');
const Panel = require('react-bootstrap/lib/Panel');

const poiIcon = createMarker('#ddf');
const observerIcon = createMarker('#f88');
const activeObserverIcon = createMarker('#f00');
const activePoiIcon = createMarker('#66f');

const mapDefinitions = require('./mapDefinitions');

const localStorageName = 'toposcope1';

const languages = { en: 'English', sk: 'Slovensky', cs: 'Česky' };

const cleanState = {
  pois: [],
  activePoiId: null,
  inscriptions: [ '', '{a}', '', '' ]
};

class Main extends React.Component {

  constructor(props) {
    super(props);

    const toposcope = JSON.parse(localStorage.getItem(localStorageName));
    const language = toposcope && toposcope.language ||
      navigator.languages.map(language => language.split('-')[0]).find(language => languages[language])

    this.state = Object.assign({}, cleanState, {
      map: 'OpenStreetMap Mapnik',
      center: L.latLng(0, 0),
      zoom: 1,
      mode: '',
      fetching: false,
      language,
      messages: readMessages(language),
      showHelp: false,
      loadPoiMaxDistance: 1000
    });

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
    this.setState(this.state.mode === 'delete_poi' ?
      { activePoiId: null, pois: [ ...this.state.pois.filter(({ id }) => id !== poiId) ] }
      : { activePoiId: poiId });
  }

  handleMapClick(e) {
    if (this.state.mode === 'add_poi') {
      this.setState({
        activePoiId: this.nextId,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '{d} km', id: this.nextId, observer: this.state.pois.length === 0 } ]
      });
      this.nextId--;
    } else if (this.state.mode === 'load_peaks') {
      const { lat, lng } = e.latlng;
      const radius = parseFloat(this.state.loadPoiMaxDistance);
      this.setState({ fetching: true });
      loadPeaks(lat, lng, !isNaN(radius) && radius > 0 && radius <= 20000 ? radius : 1000, this.state.language, this.state.addLineBreaks).then(pois => {
        if (this.state.pois.length === 0 && pois.length) {
          pois[0].observer = true;
        }
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

  handleSaveImage() {
    FileSaver.saveAs(new Blob([ this.refs.toposcope.innerHTML.replace(/&nbsp;/g, '&#160;') ], { type: 'image/svg+xml' }), 'toposcope.svg');
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

  handleFontSizeChange(e) {
    this.setState({ fontSize: e.target.value });
  }

  handleAddLineBreaksChange() {
    this.setState({ addLineBreaks: !this.state.addLineBreaks });
  }

  handlePreventUpturnedTextChange() {
    this.setState({ preventUpturnedText: !this.state.preventUpturnedText });
  }

  handleNewProject() {
    this.setState(cleanState);
  }

  handleSaveProject() {
    FileSaver.saveAs(new Blob([ localStorage.getItem(localStorageName) ], { type: 'application/json' }), 'toposcope.json');
  }

  handleLoadProject() {
    const { file } = this.refs;
    file.style.display = '';
    file.focus();
    file.click();
    file.style.display = 'none';
  }

  load() {
    const file = this.refs.file.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          this.setState(JSON.parse(e.target.result));
          this.refs.file.value = null;
        } catch (e) {
          window.alert(this.state.messages['importError']);
        }
      };
      reader.readAsText(file);
    }
  }

  render() {
    const { pois, activePoiId, mode, fetching, center, zoom, map, messages, language,
      inscriptions, showHelp, innerCircleRadius, loadPoiMaxDistance, fontSize, addLineBreaks, preventUpturnedText } = this.state;
    const activePoi = pois.find(({ id }) => id === activePoiId);
    const observerPoi = pois.find(({ observer }) => observer);
    const t = key => messages[key] || key;
    const icr = parseFloat(innerCircleRadius);

    return (
      <Hourglass active={fetching}>
        <Help onClose={this.handleHideHelp.bind(this)} show={showHelp} messages={messages}/>
        <input type="file" ref="file" onChange={this.load.bind(this)} style={{ display: 'none' }}/>

        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>Toposcope Maker</Navbar.Brand>
            <Navbar.Toggle/>
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <NavDropdown title={<span><Glyphicon glyph="book"/> {t('project')}</span>} id="basic-nav-dropdown">
                <NavItem onClick={this.handleNewProject.bind(this)}><Glyphicon glyph="file"/> {t('newProject')}</NavItem>
                <NavItem onClick={this.handleLoadProject.bind(this)}><Glyphicon glyph="open"/> {t('loadProject')}</NavItem>
                <NavItem onClick={this.handleSaveProject.bind(this)}><Glyphicon glyph="save"/> {t('saveProject')}</NavItem>
                <NavItem onClick={this.handleSaveImage.bind(this)} disabled={!observerPoi}><Glyphicon glyph="picture"/> {t('saveToposcope')}</NavItem>
              </NavDropdown>
              <NavItem active={mode === 'add_poi'} onClick={this.handleSetMode.bind(this, 'add_poi')} title={t('addPoi')}>
                <Glyphicon glyph="map-marker"/><span className="hidden-sm hidden-md hidden-lg"> {t('addPoi')}</span>
              </NavItem>
              <NavItem active={mode === 'load_peaks'} onClick={this.handleSetMode.bind(this, 'load_peaks')} title={t('loadPeaks')}>
                <Glyphicon glyph="triangle-top"/><span className="hidden-sm hidden-md hidden-lg"> {t('loadPeaks')}</span>
              </NavItem>
              <NavItem active={mode === 'move_poi'} onClick={this.handleSetMode.bind(this, 'move_poi')} title={t('move')}>
                <Glyphicon glyph="move"/><span className="hidden-sm hidden-md hidden-lg"> {t('move')}</span>
              </NavItem>
              <NavItem active={mode === 'delete_poi'} onClick={this.handleSetMode.bind(this, 'delete_poi')} title={t('delete')}>
                <Glyphicon glyph="remove"/><span className="hidden-sm hidden-md hidden-lg"> {t('delete')}</span>
              </NavItem>
              <NavItem onClick={this.handleShowHelp.bind(this)}><Glyphicon glyph="question-sign"/> {t('help')}</NavItem>
              <NavDropdown title={<span><Glyphicon glyph="flag"/> {t('language')}</span>} id="basic-nav-dropdown">
                {Object.keys(languages).map(code =>
                  <MenuItem onClick={this.handleSetLanguage.bind(this, code)} key={code}>
                    {languages[code]}{language === code ? ' ✓' : ''}
                  </MenuItem>)
                }
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <Panel>
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
              </Panel>
            </div>
            <div className="col-md-6" ref="toposcope">
              {observerPoi &&
                <Toposcope pois={pois} messages={messages} inscriptions={inscriptions} language={language}
                  innerRadius={!isNaN(icr) && icr > 0 && icr <= 80 ? icr : 25} fontSize={parseFloat(fontSize) || 4}
                  preventUpturnedText={preventUpturnedText}/>
              }
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <Panel>
                {[ [ 'south', 'east' ], [ 'south', 'west' ], [ 'north', 'west' ], [ 'north', 'east' ] ].map(([ c1, c2 ], i) =>
                  <FormGroup key={i}>
                    <ControlLabel>{t('inscription')} {t(c1)}–{t(c2)}</ControlLabel>
                    <FormControl type="text" value={inscriptions[i]} onChange={this.handleCustomTextChange.bind(this, i)}/>
                  </FormGroup>
                )}
              </Panel>
            </div>
            <div className="col-md-4">
              <Panel>
                <FormGroup>
                  <ControlLabel>{t('innerCircleRadius')}</ControlLabel>
                  <FormControl type="number" min="0" max="80" value={innerCircleRadius} onChange={this.handleInnerCircleRadiusChange.bind(this)}/>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('fontSize')}</ControlLabel>
                  <FormControl type="number" min="0" max="10" step="0.1" value={fontSize} onChange={this.handleFontSizeChange.bind(this)}/>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('preventUpturnedText')}</ControlLabel>
                  <Checkbox checked={preventUpturnedText} onChange={this.handlePreventUpturnedTextChange.bind(this)}/>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('loadPoiMaxDistance')}</ControlLabel>
                  <FormControl type="number" min="1" max="20000" value={loadPoiMaxDistance} onChange={this.handleLoadPoiMaxDistanceChange.bind(this)}/>
                </FormGroup>
                <FormGroup>
                  <ControlLabel>{t('addLineBreaks')}</ControlLabel>
                  <Checkbox checked={addLineBreaks} onChange={this.handleAddLineBreaksChange.bind(this)}/>
                </FormGroup>
              </Panel>
            </div>
            <div className="col-md-4">
              {activePoi &&
                <Panel>
                  <FormGroup>
                    <ControlLabel>{t('label')}</ControlLabel>
                    <FormControl componentClass="textarea" rows="2" value={activePoi.text} onChange={this.handleTextChange.bind(this)} placeholder={t('labelPlaceholder')}/>
                  </FormGroup>
                  <FormGroup>
                    <ControlLabel>{t('observer')}</ControlLabel>
                    <Checkbox checked={!!activePoi.observer} onChange={this.handleObserverChange.bind(this)}/>
                  </FormGroup>
                </Panel>
              }
            </div>
          </div>
        </div>
      </Hourglass>
    );
  }
}

function readMessages(language) {
  const messages = Object.assign({}, require(`../i18n/en.json`), require(`../i18n/${language}.json`));
  Object.keys(messages).forEach(function (key) {
    const message = messages[key];
    if (Array.isArray(message)) {
      messages[key] = message.join('\n');
    }
  });
  return messages;
}

ReactDOM.render(<Main/>, document.getElementById('main'));

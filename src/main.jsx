import React from 'react';
import { Map, TileLayer, Marker, LayersControl } from 'react-leaflet';
import FileSaver from 'file-saver';
import Navbar from 'react-bootstrap/lib/Navbar';
import Nav from 'react-bootstrap/lib/Nav';
import NavItem from 'react-bootstrap/lib/NavItem';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import NavDropdown from 'react-bootstrap/lib/NavDropdown';
import MenuItem from 'react-bootstrap/lib/MenuItem';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Glyphicon from 'react-bootstrap/lib/Glyphicon';
import Panel from 'react-bootstrap/lib/Panel';
import ButtonGroup from 'react-bootstrap/lib/ButtonGroup';
import Button from 'react-bootstrap/lib/Button';

import Toposcope from './toposcope.jsx';
import Help from './help.jsx';
import Settings from './settings.jsx';
import Hourglass from './hourglass.jsx';
import createMarker from './markers.js';
import loadPeaks from './poiLoader.js';
import { languages, getBrowserLanguage, readMessages } from './i18n.js';
import mapDefinitions from './mapDefinitions';

const poiIcon = createMarker('#ddf');
const observerIcon = createMarker('#f88');
const activeObserverIcon = createMarker('#f00');
const activePoiIcon = createMarker('#66f');

const localStorageName = 'toposcope1';

const cleanState = {
  pois: [],
  activePoiId: null,
  inscriptions: [ '', '{a}', '', '' ]
};

export default class Main extends React.Component {

  constructor(props) {
    super(props);

    const toposcope = JSON.parse(localStorage.getItem(localStorageName));
    const language = getBrowserLanguage(toposcope && toposcope.language);
    delete toposcope.language;

    this.state = Object.assign({}, cleanState, {
      map: 'OpenStreetMap Mapnik',
      center: L.latLng(0, 0),
      zoom: 1,
      mode: '',
      fetching: false,
      language,
      messages: readMessages(language),
      showHelp: false,
      showSettings: false,
      loadPoiMaxDistance: 1000,
      onlyNearest: true
    }, toposcope || {});

    this.nextId = this.state.pois.reduce((a, { id }) => Math.min(a, id), 0) - 1;
  }

  componentDidUpdate() {
    const toSave = {};
    [ 'pois', 'activePoiId', 'inscriptions', 'map', 'center', 'zoom', 'mode', 'language', 'loadPoiMaxDistance', 'onlyNearest' ]
      .forEach(prop => toSave[prop] = this.state[prop]);
    localStorage.setItem(localStorageName, JSON.stringify(toSave));
  }

  handleMapMove(e) {
    this.setState({ center: e.target.getCenter() });
  }

  handleMapZoom(e) {
    this.setState({ zoom: e.target.getZoom() });
  }

  handlePoiClick(poiId) {
    this.setState(this.state.mode === 'deletePoi' ?
      { activePoiId: null, pois: [ ...this.state.pois.filter(({ id }) => id !== poiId) ] }
      : { activePoiId: poiId });
  }

  handlePoiClick2(poiId) {
    this.handlePoiClick(poiId);
    const poi = this.state.pois.find(({ id }) => id === poiId);
    this.refs.map.leafletElement.panTo([ poi.lat, poi.lng ], { animate: false }); // TODO animation doesn't work for some reason
  }

  handleMapClick(e) {
    if (this.state.mode === 'setObserver') {
      const observer = this.state.pois.find(({ observer }) => observer);
      this.setState({
        activePoiId: observer ? observer.id : this.nextId,
        pois: [
          ...this.state.pois.filter(poi => poi !== observer),
          observer ? Object.assign({}, observer, { lat: e.latlng.lat, lng: e.latlng.lng })
            : { lat: e.latlng.lat, lng: e.latlng.lng, text: '', id: this.nextId, observer: true }
        ]
      });
      this.nextId--;
    } else if (this.state.mode === 'addPoi') {
      this.setState({
        activePoiId: this.nextId,
        pois: [ ...this.state.pois, { lat: e.latlng.lat, lng: e.latlng.lng, text: '{d} km', id: this.nextId, observer: false } ]
      });
      this.nextId--;
    } else if (this.state.mode === 'loadPois') {
      const { loadPoiMaxDistance, language, addLineBreaks, onlyNearest } = this.state;
      const { lat, lng } = e.latlng;
      const radius = loadPoiMaxDistance > 0 && loadPoiMaxDistance <= 20000 ? loadPoiMaxDistance : 1000;
      this.setState({ fetching: true });
      loadPeaks(lat, lng, radius, language, addLineBreaks, onlyNearest).then(pois => {
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

  handleHelpVisibility(showHelp) {
    this.setState({ showHelp });
  }

  handleSettingsVisibility(showSettings) {
    this.setState({ showSettings });
  }

  handleSaveSettings(settings) {
    this.setState(Object.assign({ showSettings: false }, settings));
  }

  handleInnerCircleRadiusChange(e) {
    this.setState({ innerCircleRadius: e.target.value });
  }

  handleFontSizeChange(e) {
    this.setState({ fontSize: e.target.value });
  }

  handlePreventUpturnedTextChange() {
    this.setState({ preventUpturnedText: !this.state.preventUpturnedText });
  }

  handleNewProject() {
    this.setState(cleanState);
  }

  handleSaveProject() {
    const toSave = {};
    [ 'pois', 'activePoiId', 'inscriptions', 'map', 'center', 'zoom' ]
      .forEach(prop => toSave[prop] = this.state[prop]);
    FileSaver.saveAs(new Blob([ JSON.stringify(toSave) ], { type: 'application/json' }), 'toposcope.json');
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
      inscriptions, showHelp, showSettings, innerCircleRadius, loadPoiMaxDistance, onlyNearest,
      fontSize, addLineBreaks, preventUpturnedText } = this.state;

    const activePoi = pois.find(({ id }) => id === activePoiId);
    const observerPoi = pois.find(({ observer }) => observer);
    const t = key => messages[key] || key;
    const icr = parseFloat(innerCircleRadius);

    return (
      <Hourglass active={fetching}>
        <style>{`
          .leaflet-container {
            cursor: ${[ 'setObserver', 'addPoi', 'loadPois' ].indexOf(mode) !== -1 ? 'crosshair' : ''};
          }

          .leaflet-marker-icon {
            cursor: ${mode === 'movePoi' ? 'move' : mode === 'deletePoi' ? 'crosshair' : ''}
          }
        `}</style>

      <Help onClose={this.handleHelpVisibility.bind(this, false)} show={showHelp} messages={messages} language={language}/>
        <Settings onClose={this.handleSettingsVisibility.bind(this, false)} onSave={this.handleSaveSettings.bind(this)}
          show={showSettings} messages={messages}
          loadPoiMaxDistance={loadPoiMaxDistance}
          addLineBreaks={addLineBreaks}
          onlyNearest={onlyNearest}/>

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
              <NavItem onClick={this.handleSettingsVisibility.bind(this, true)}><Glyphicon glyph="wrench"/> {t('settings')}</NavItem>
              <NavItem onClick={this.handleHelpVisibility.bind(this, true)}><Glyphicon glyph="question-sign"/> {t('help')}</NavItem>
              <NavDropdown title={<span><Glyphicon glyph="globe"/> {t('language')}</span>} id="basic-nav-dropdown">
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
              <Panel className="map-panel">
                <ButtonGroup vertical className="tool-buttons">
                  {[ [ 'setObserver', 'eye-open' ], [ 'addPoi', 'map-marker' ], [ 'loadPois', 'record' ],
                      [ 'movePoi', 'move' ], [ 'deletePoi', 'remove' ] ].map(([ m, icon ]) => (
                    <Button key={m} bsStyle={`${mode === m ? 'primary' : 'default'}`} bsSize="small" onClick={this.handleSetMode.bind(this, m)} title={t(m)}>
                      <Glyphicon glyph={icon}/>
                    </Button>
                  ))}
                </ButtonGroup>
                <Map ref="map" style={{ width: '100%', height: '500px' }} center={center} zoom={zoom}
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
                      draggable={mode === 'movePoi'}/>
                  )}
                </Map>
              </Panel>
            </div>
            <div className="col-md-6" ref="toposcope">
              {observerPoi &&
                <Toposcope pois={pois} messages={messages} inscriptions={inscriptions} language={language}
                  innerRadius={!isNaN(icr) && icr > 0 && icr <= 80 ? icr : 25}
                  fontSize={parseFloat(fontSize) || 4}
                  preventUpturnedText={preventUpturnedText}
                  onClick={this.handlePoiClick2.bind(this)}/>
              }
            </div>
          </div>
          <div className="row">
            <div className="col-md-4">
              <Panel>
                {[ [ 'south', 'east' ], [ 'south', 'west' ], [ 'north', 'west' ], [ 'north', 'east' ] ].map(([ c1, c2 ], i) =>
                  <FormGroup key={i} controlId={`inscription-${c1}-${c2}`}>
                    <ControlLabel>{t('inscription')} {t(c1)}–{t(c2)}</ControlLabel>
                    <FormControl type="text" value={inscriptions[i]} onChange={this.handleCustomTextChange.bind(this, i)}/>
                  </FormGroup>
                )}
              </Panel>
            </div>
            <div className="col-md-4">
              <Panel>
                <FormGroup controlId="innerCircleRadius">
                  <ControlLabel>{t('innerCircleRadius')}</ControlLabel>
                  <FormControl type="number" min="0" max="80" value={innerCircleRadius} onChange={this.handleInnerCircleRadiusChange.bind(this)}/>
                </FormGroup>
                <FormGroup controlId="fontSize">
                  <ControlLabel>{t('fontSize')}</ControlLabel>
                  <FormControl type="number" min="0" max="10" step="0.1" value={fontSize} onChange={this.handleFontSizeChange.bind(this)}/>
                </FormGroup>
                <FormGroup controlId="preventUpturnedText">
                  <ControlLabel>{t('preventUpturnedText')}</ControlLabel>
                  <Checkbox checked={preventUpturnedText} onChange={this.handlePreventUpturnedTextChange.bind(this)}/>
                </FormGroup>
              </Panel>
            </div>
            <div className="col-md-4">
              {activePoi &&
                <Panel>
                  <FormGroup controlId="label">
                    <ControlLabel>{t('label')}</ControlLabel>
                    <FormControl componentClass="textarea" rows="2" value={activePoi.text} onChange={this.handleTextChange.bind(this)} placeholder={t('labelPlaceholder')}/>
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

const React = require('react');
const Modal = require('react-bootstrap-modal');
const FormGroup = require('react-bootstrap/lib/FormGroup');
const ControlLabel = require('react-bootstrap/lib/ControlLabel');
const FormControl = require('react-bootstrap/lib/FormControl');
const Checkbox = require('react-bootstrap/lib/Checkbox');
const Button = require('react-bootstrap/lib/Button');

class Settings extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loadPoiMaxDistance: props.loadPoiMaxDistance.toString(),
      addLineBreaks: props.addLineBreaks,
      onlyNearest: props.onlyNearest
    };
  }

  componentWillReceiveProps(newProps) {
    this.setState({
      loadPoiMaxDistance: newProps.loadPoiMaxDistance.toString(),
      addLineBreaks: newProps.addLineBreaks,
      onlyNearest: newProps.onlyNearest
    });
  }

  handleSave() {
    const settings = Object.assign({}, this.state);
    settings.loadPoiMaxDistance = parseInt(settings.loadPoiMaxDistance);
    this.props.onSave(settings);
  }

  handleLoadPoiMaxDistanceChange(e) {
    this.setState({ loadPoiMaxDistance: e.target.value });
  }

  handleAddLineBreaksChange() {
    this.setState({ addLineBreaks: !this.state.addLineBreaks });
  }

  handleOnlyNearestChange() {
    this.setState({ onlyNearest: !this.state.onlyNearest });
  }

  render() {
    const { loadPoiMaxDistance, addLineBreaks, onlyNearest } = this.state;
    const { show, onClose, messages } = this.props;
    const t = key => messages[key] || key;

    return (
      <Modal show={show} onHide={onClose}>
        <Modal.Header closeButton>
          <Modal.Title>{t('settings')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId="loadPoiMaxDistance">
            <ControlLabel>{t('loadPoiMaxDistance')}</ControlLabel>
            <FormControl type="number" min="1" max="20000" value={loadPoiMaxDistance} onChange={this.handleLoadPoiMaxDistanceChange.bind(this)}/>
          </FormGroup>
          <FormGroup controlId="onlyNearest">
            <ControlLabel>{t('onlyNearest')}</ControlLabel>
            <Checkbox checked={onlyNearest} onChange={this.handleOnlyNearestChange.bind(this)}/>
          </FormGroup>
          <FormGroup controlId="addLineBreaks">
            <ControlLabel>{t('addLineBreaks')}</ControlLabel>
            <Checkbox checked={addLineBreaks} onChange={this.handleAddLineBreaksChange.bind(this)}/>
          </FormGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button bsStyle="primary" onClick={this.handleSave.bind(this)} disabled={!(loadPoiMaxDistance > 0 && loadPoiMaxDistance <= 20000)}>{t('save')}</Button>
          <Modal.Dismiss className='btn btn-default'>{t('cancel')}</Modal.Dismiss>
        </Modal.Footer>
      </Modal>
    );
  }
}

Settings.propTypes = {
  show: React.PropTypes.bool,
  onClose: React.PropTypes.func.isRequired,
  messages: React.PropTypes.object.isRequired,
  loadPoiMaxDistance:React.PropTypes.number.isRequired,
  addLineBreaks: React.PropTypes.bool.isRequired,
  onlyNearest: React.PropTypes.bool.isRequired,
  onSave: React.PropTypes.func.isRequired
};

module.exports = Settings;

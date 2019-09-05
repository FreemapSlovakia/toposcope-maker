import React from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap-modal';
import FormGroup from 'react-bootstrap/lib/FormGroup';
import ControlLabel from 'react-bootstrap/lib/ControlLabel';
import FormControl from 'react-bootstrap/lib/FormControl';
import Checkbox from 'react-bootstrap/lib/Checkbox';
import Button from 'react-bootstrap/lib/Button';

export default class Settings extends React.Component {

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
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  messages: PropTypes.object.isRequired,
  loadPoiMaxDistance:PropTypes.number.isRequired,
  addLineBreaks: PropTypes.bool.isRequired,
  onlyNearest: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired
};

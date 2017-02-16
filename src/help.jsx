const React = require('react');
const Modal = require('react-bootstrap-modal');

module.exports = Help;

function Help({ show, onClose, messages }) {
  const t = key => messages[key] || key;

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('help')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div dangerouslySetInnerHTML={{__html: t('helpText')}}/>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Dismiss className='btn btn-default'>{t('close')}</Modal.Dismiss>
      </Modal.Footer>
    </Modal>
  );
}

Help.propTypes = {
  show: React.PropTypes.bool,
  onClose: React.PropTypes.func.isRequired,
  messages: React.PropTypes.object.isRequired,
};

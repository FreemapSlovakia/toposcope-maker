import React from 'react';
import Modal from 'react-bootstrap-modal';
import PropTypes from 'prop-types';

export default function Help({ show, onClose, messages, language }) {
  const t = key => messages[key] || key;

  return (
    <Modal dialogClassName='modal-lg' show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('help')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div dangerouslySetInnerHTML={{__html: require(`../i18n/help-${language}.txt`)}}/>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Dismiss className='btn btn-default'>{t('close')}</Modal.Dismiss>
      </Modal.Footer>
    </Modal>
  );
}

Help.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  language: PropTypes.string.isRequired,
  messages: PropTypes.object.isRequired,
};

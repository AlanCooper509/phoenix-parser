import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import './InfoModal.css';

function ResponseModal({show, handleClose, message}) {
    return (
        <Modal backdropClassName="fixed-backdrop" show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title><span className="text-muted">Update Game Data</span></Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {message}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ResponseModal;
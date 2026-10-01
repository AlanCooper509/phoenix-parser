import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import calculateZoomLevel from '../Helpers/calculateZoomLevel';

import './InfoModal.css';

function ResponseModal({show, handleClose, message}) {
    const minWidth = 800;
    const zoomLevel = calculateZoomLevel(minWidth);

    return (
        <Modal show={show} onHide={handleClose}
            backdropClassName="fixed-backdrop"
            size="lg"
            style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minHeight: `${100/zoomLevel}%`}}
        >
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
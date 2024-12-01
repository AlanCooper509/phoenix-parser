import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import PumbilityTable from '../../../TableHelpers/PumbilityTable';
import calculateZoomLevel from '../../../Helpers/calculateZoomLevel';

function PumbilityModal({show, handleClose, total, entries}) {
    const minWidth = 800;
    const zoomLevel = calculateZoomLevel(minWidth);
    return (
        <Modal show={show} onHide={handleClose}
            backdropClassName="fixed-backdrop" size="lg"
            style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minHeight: `${100/zoomLevel}%`}}
        >
            <Modal.Header closeButton>
                <Modal.Title>Pumbility: {total}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <PumbilityTable
                    rowData={entries}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default PumbilityModal;
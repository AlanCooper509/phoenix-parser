import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ChartsTable from '../../TableHelpers/ChartsTable';
import calculateZoomLevel from '../../Helpers/calculateZoomLevel';

function BreakdownModal({show, handleClose, title, remainingCharts, language}) {
    const minWidth = 800;
    const zoomLevel = calculateZoomLevel(minWidth);
    return (
        <Modal show={show} onHide={handleClose}
            backdropClassName="fixed-backdrop" size="lg"
            style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minHeight: `${100/zoomLevel}%`}}
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ChartsTable
                    rowData={remainingCharts}
                    language={language}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
      );
}

export default BreakdownModal;
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ChartsTable from '../../TableHelpers/ChartsTable';

function BreakdownModal({show, handleClose, title, remainingCharts}) {
    return (
        <Modal backdropClassName="fixed-backdrop" size="lg" show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ChartsTable
                    rowData={remainingCharts}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>Close</Button>
            </Modal.Footer>
        </Modal>
      );
}

export default BreakdownModal;
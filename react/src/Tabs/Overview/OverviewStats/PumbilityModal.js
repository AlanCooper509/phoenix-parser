import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import PumbilityTable from '../../../TableHelpers/PumbilityTable';

function PumbilityModal({show, handleClose, total, entries}) {
    return (
        <>
        <Modal backdropClassName="fixed-backdrop" size="lg" show={show} onHide={handleClose}>
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
        </>
    );
}

export default PumbilityModal;
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import ProfileMini from '../Profile/ProfileMini';

import './UsersModal.css';

function UsersModal({show, handleClose, data}) {
    let userlist = [];
    for (let entry of data) {
        userlist.push(
            <ProfileMini
                info={entry.info}
                key={entry.info.player + entry.info.number}
            />
        );        
    }

    return (
    <Modal backdropClassName="fixed-backdrop" size="md" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Select a User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <div className="container">
            <div className="row">
                <div className="d-flex justify-content-center">
                    {userlist}
                </div>
            </div>
        </div>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
    </Modal>
  );
}

export default UsersModal;
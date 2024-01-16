import { useState } from "react";
import Button from 'react-bootstrap/Button';
import InfoModal from "./InfoModal";

function ResyncForm() {
    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <div className="d-flex flex-column">
            Update Game Data
            <div className="d-flex mt-2">
                <div className="d-flex flex-column align-items-end">
                    <input type="text" className="form-control" id="formGroupExampleInput" placeholder="Session ID"/>
                    <div className="d-flex mt-1 justify-content-between w-100">
                        <small className="form-text link-primary" style={{cursor: "pointer"}} onClick={handleShow}>What is this?</small>
                        <InfoModal
                            show={show}
                            handleClose={handleClose}
                        />
                        <Button className="btn btn-sm border-dark btn-secondary ms-2">Sync</Button>
                    </div>
                </div>
                <div>
                </div>
            </div>
        </div>
    );
}

export default ResyncForm;
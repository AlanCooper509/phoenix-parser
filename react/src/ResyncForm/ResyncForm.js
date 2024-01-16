import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import InfoModal from "./InfoModal";
import postSyncData from "../API/syncdata";

function ResyncForm() {
    // for info modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // for submitting
    const sid = useRef(null);
    const params = useParams();
    const name = params.name.toUpperCase();
    const number = params.number;
    const handleOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        handleSubmit();
    }
    function handleSubmit() {
        if(!sid.current) { return };
        if(!sid.current.value) { return };
        if(sid.current.value.match(/[^a-zA-Z0-9]/g)) { return };
        postSyncData(name, number, sid.current.value);
    }

    return (
        <div className="d-flex flex-column">
            Update Game Data
            <div className="d-flex mt-2">
                <div className="d-flex flex-column align-items-end">
                    <input ref={sid} type="text" className="form-control" onKeyDown={handleOnEnter} placeholder="Session ID"/>
                    <div className="d-flex mt-1 justify-content-between w-100">
                        <small className="form-text link-primary" style={{cursor: "pointer"}} onClick={handleShow}>What is this?</small>
                        <InfoModal
                            show={show}
                            handleClose={handleClose}
                        />
                        <Button className="btn btn-sm border-dark btn-secondary ms-2" onClick={handleSubmit}>Sync</Button>
                    </div>
                </div>
                <div>
                </div>
            </div>
        </div>
    );
}

export default ResyncForm;
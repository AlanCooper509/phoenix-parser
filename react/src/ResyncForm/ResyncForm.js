import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { BsChevronCompactDown } from "react-icons/bs";

import InfoModal from "./InfoModal";
import ResponseModal from "./ResponseModal";
import postSyncData from "../API/syncdata";

function ResyncForm() {
    // for info modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // for response modal
    const [notify, setNotify] = useState(false);
    const [message, setMessage] = useState('');
    const closeNotify = () => {setNotify(false);};
    const openNotify = (msg) => {setMessage(msg); setNotify(true)};

    // for submitting
    const [showForm, setShowForm] = useState(false);
    const sid = useRef(null);
    const submitBtn = useRef(null);
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
        const params = {name: name, number: number, sid: sid.current.value};
        postSyncData(params, submitBtn, openNotify);
    }

    return (
        <div className="d-flex flex-column align-items-end">
            <span className="me-2" style={{cursor: "pointer"}} onClick={() => {setShowForm(!showForm)}}>
                <BsChevronCompactDown style={{transform: `rotate(${showForm ? 180 : 0}deg)`}}/>&nbsp;&nbsp;Update Game Data</span>
            <Collapse in={showForm}>
                <div className="mt-2">
                    <div className="d-flex flex-column align-items-end">
                        <input ref={sid} type="text" className="form-control" onKeyDown={handleOnEnter} placeholder="Session ID"/>
                        <div className="d-flex mt-1 justify-content-between w-100">
                            <small className="form-text link-primary" style={{cursor: "pointer"}} onClick={handleShow}>What is this?</small>
                            <InfoModal
                                show={show}
                                handleClose={handleClose}
                            />
                            <Button ref={submitBtn} className=" btn btn-sm border-dark btn-secondary ms-2" onClick={handleSubmit}>
                                <span>Submit</span>
                            </Button>
                            <ResponseModal
                                show={notify}
                                handleClose={closeNotify}
                                message={message}
                            />
                        </div>
                    </div>
                </div>
            </Collapse>
        </div>
    );
}

export default ResyncForm;
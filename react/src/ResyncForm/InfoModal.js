import { useState } from "react";
import { useParams } from "react-router-dom";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { ImNewTab } from "react-icons/im";
import { RxQuestionMarkCircled } from "react-icons/rx";

import example from './example_sid.png';
import './InfoModal.css';

function InfoModal({show, handleClose}) {
    const params = useParams();
    const name = params.name;
    const number = params.number;
    const [open, setOpen] = useState(false);

    return (
    <Modal size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Syncing your PIU Phoenix Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <ol>
                <li className="mb-4">
                    Navigate to YOUR user page on this site.
                    <ul>
                        <li><i>Currently viewing: <b>{name} #{number}</b></i></li>
                    </ul>
                </li>
                <li className="mb-4">
                    Login to <a href="https://piugame.com" target="_blank">piugame.com<sup><ImNewTab /></sup></a> on a Desktop/Laptop device.
                </li>
                <li className="mb-4">
                    While still on the PIU Game website,
                    open <span style={{cursor: "pointer"}} onClick={() => {setOpen(!open)}}><b>Console</b><sup className="link-primary"><RxQuestionMarkCircled/></sup> on <b>
                        DevTools</b> </span>
                <Collapse in={open}>
                    <ul>
                        <li>(<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>) on Windows</li>
                        <li>(<kbd>Option</kbd> + <kbd>⌘</kbd> + <kbd>J</kbd>) on MacOS</li>
                    </ul>
                </Collapse>
                </li>
                <li className="mb-4">
                    Type <code>document.cookie</code> and press <kbd>Enter</kbd>
                    <ul>
                        <li>For Example:</li>
                    <img className="border border-light pe-2 pb-2 pt-1 mt-2" style={{filter: "brightness(85%)" }} src={example}></img>
                    </ul>
                </li>
                <li className="mb-4">
                    Copy over the sid value <code>&lt;...&gt;</code> from <code>sid=&lt;...&gt;;</code> into the Session ID input box and press <kbd>Enter</kbd>
                    <ul>
                        <li><i className="text-muted">The SID value is not stored or saved anywhere</i></li>
                    </ul>
                </li>
            </ol>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
        </Modal.Footer>
    </Modal>
  );
}

export default InfoModal;
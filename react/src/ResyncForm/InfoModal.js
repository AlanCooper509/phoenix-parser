import { useState } from "react";
import { useParams } from "react-router-dom";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { ImNewTab } from "react-icons/im";
import { RxQuestionMarkCircled } from "react-icons/rx";

import example from './example_sid.png';
import bookmark from './example_bookmark.png';
import './InfoModal.css';

function InfoModal({show, handleClose}) {
    const params = useParams();
    const name = params.name.toUpperCase();
    const number = params.number;
    const [open, setOpen] = useState(false);
    const [desktop, setDesktop] = useState(false);
    const [mobile, setMobile] = useState(false);
    const [bookmarklet, setBookmarklet] = useState(false);

    return (
    <Modal backdropClassName="fixed-backdrop" size="lg" show={show} onHide={handleClose}>
        <Modal.Header closeButton>
            <Modal.Title>Syncing your PIU Phoenix Data</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <ol>
                <li className="mb-4">
                    Navigate to your USER PAGE on this site
                    <ul className="mt-2">
                        <li><i>Currently viewing: <b>{name} #{number}</b></i></li>
                    </ul>
                </li>
                <li className="mb-4">
                    Log in to <a href="https://piugame.com" target="_blank" rel="noreferrer">piugame.com<sup><ImNewTab /></sup></a>
                </li>
                <li>
                    Find the SID value
                    <ul>
                        <li>
                            <span style={{cursor: "pointer"}} onClick={() => {setDesktop(!desktop)}}>For <b><u>Desktop</u></b></span>
                        </li>
                        <Collapse in={desktop}>
                            <ul>
                            <li>
                                While still on the PIU Game website tab,
                                open <span style={{cursor: "pointer"}} onClick={() => {setOpen(!open)}}><b>Console</b><sup className="link-primary"><RxQuestionMarkCircled/></sup> on <b>
                                    DevTools</b> </span>
                            <Collapse in={open}>
                                <ul className="mt-2">
                                    <li>(<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>) on Windows</li>
                                    <li>(<kbd>Option</kbd> + <kbd>⌘</kbd> + <kbd>J</kbd>) on MacOS</li>
                                </ul>
                            </Collapse>
                            </li>
                            <li className="mb-4">
                                Type <code>document.cookie</code> and press <kbd>Enter</kbd>
                                <ul>
                                    <li>For Example:</li>
                                <img alt="Example Screenshot" className="border border-light pe-2 pb-2 pt-1 mt-2" style={{filter: "brightness(85%)" }} src={example}></img>
                                </ul>
                            </li>
                            </ul>
                        </Collapse>
                        <li className="mt-1">
                            <span style={{cursor: "pointer"}} onClick={() => {setMobile(!mobile)}}>For <b><u>Mobile</u></b></span>
                        </li>
                        <Collapse in={mobile}>
                            <ul>
                                <li>(ONE-TIME SETUP) <span style={{cursor: "pointer"}} onClick={() => {setBookmarklet(!bookmarklet)}}>Create a mobile bookmark<sup className="link-primary"><RxQuestionMarkCircled/></sup></span> with URL: <code>javascript:document.cookie</code></li>
                                <Collapse in={bookmarklet}>
                                    <ul>
                                        <li>Example bookmarklet (using Chrome App):</li>
                                    <img alt="Example Bookmark" className="border border-light mt-2" 
                                        style={{filter: "brightness(85%)", width: "350px"}} src={bookmark}></img>

                                    </ul>
                                </Collapse>
                                <li>While still on the PIU Game website tab, TAP on the URL search bar</li>
                                <li>Type out your created bookmark name and TAP on your saved bookmarklet</li>
                            </ul>
                        </Collapse>
                    </ul>
                </li>
                <li className="mt-4">
                    Copy over the <b>sid</b> value <code>&lt;...&gt;</code> from <code>sid=&lt;...&gt;;</code> into the Session ID input box and press <kbd>Enter</kbd>
                    <ul className="mt-2">
                        <li><i className="text-muted">The SID value is a temporary auth credential and will not be stored or saved anywhere.</i></li>
                        <li><i className="text-muted">The SID is used for collecting a snapshot of your Player Card, Best Scores, and Titles.</i></li>
                        <li><i className="text-muted">You can only sync data for your own USER PAGE, but the returned snapshot data is public.</i></li>
                        <li><i className="text-muted">To avoid spamming, syncing is only available once every day.</i>
                        </li>
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
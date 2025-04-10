import { useState } from "react";
import { useParams } from "react-router-dom";

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { ImNewTab } from "react-icons/im";
import { RxQuestionMarkCircled } from "react-icons/rx";
import { IoShareOutline } from "react-icons/io5";

import example from './example_sid.png';
import bookmark from './example_bookmark.png';
import scriptImg from './example_scripting.png';
import settingImg from './example_setting.png';
import cookieImg from './example_cookie.png';
import './InfoModal.css';
import calculateZoomLevel from "../Helpers/calculateZoomLevel";

function InfoModal({show, handleClose}) {
    const params = useParams();
    const name = params.name ? params.name.toUpperCase() : '';
    const number = params.number ? params.number : "HomePage";
    const [open, setOpen] = useState(false);
    const [desktop, setDesktop] = useState(false);
    const [safari, setSafari] = useState(false);
    const [seeMore, setSeeMore] = useState(false);
    const [shortcut, setShortcut] = useState(false);
    const [scripting, setScripting] = useState(false);
    const [chrome, setChrome] = useState(false);
    const [bookmarklet, setBookmarklet] = useState(false);

    const minWidth = 800;
    const zoomLevel = calculateZoomLevel(minWidth);

    return (
    <Modal show={show} onHide={handleClose}
        backdropClassName="fixed-backdrop" size="lg"
        style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left', minHeight: `${100/zoomLevel}%`}}
    >
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
                            <span style={{cursor: "pointer"}} onClick={() => {setSafari(!safari)}}>For <b><u>Safari (iOS)</u></b></span>
                        </li>
                        <Collapse in={safari}>
                            <ul>
                                <li>(ONE-TIME SETUP) Set up the <a href="https://www.icloud.com/shortcuts/4503cc77f384489abecc27a9f2b3d981" target="_blank" rel="noreferrer">Get Cookie<sup><ImNewTab /></sup></a> Shortcut <span style={{cursor: "pointer"}} onClick={() => {setSeeMore(!seeMore)}}><b><u>(See {seeMore ? "Less" : "More"})</u></b></span>
                                </li>
                                <Collapse in={seeMore} className="mb-2">
                                    <ul>
                                        <li>Follow the above link to get <span style={{cursor: "pointer"}} onClick={() => {setShortcut(!shortcut)}}>a shortcut<sup className="link-primary"><RxQuestionMarkCircled/></sup></span> made to copy the SID</li>
                                        <Collapse in={shortcut}>
                                            <ul>
                                                <li>Apple Shortcuts has a <b>"Run JavaScript on Webpage"</b> action</li>
                                                <li>This one reads <code>document.cookie</code> value and copies the SID part to Clipboard</li>
                                                <li>For more information: <a target="_blank" rel="noreferrer" href="https://support.apple.com/guide/shortcuts/use-the-run-javascript-on-webpage-action-apdb71a01d93/ios">Apple: Shortcuts User Guide<sup><ImNewTab /></sup></a></li>
                                            </ul>
                                        </Collapse>
                                        <li>Allow <span style={{cursor: "pointer"}} onClick={() => {setScripting(!scripting)}}>Scripting Actions<sup className="link-primary"><RxQuestionMarkCircled/></sup></span> for Shortcuts in Settings App
                                            <Collapse in={scripting}>
                                                <ul>
                                                    <li>
                                                        From the Get Cookie shortcut, Open Settings:
                                                    </li>
                                                    <img alt="Open Settings link in Get Cookie shortcut" className="pe-2 mt-1" style={{maxWidth: "400px"}} src={scriptImg}></img>
                                                    <li>
                                                        Alternatively, Settings App &gt; Shortcuts &gt; Advanced &gt; Allow Running Scripts
                                                    </li>
                                                    <img alt="toggling 'Allow Running Scripts' on" className="pe-2 mt-1 mb-3" style={{maxWidth: "400px"}} src={settingImg}></img>
                                                </ul>
                                            </Collapse>
                                        </li>
                                    </ul>
                                </Collapse>
                                <li>While still on the PIU Game website tab, Tap the <b>Share <IoShareOutline style={{marginTop: "-6px"}}/></b> Icon</li>
                                <li> Use the Get Cookie shortcut</li>
                                <img alt="Get Cookie shortcut in Safari" className="pe-2 mt-1" style={{maxWidth: "400px"}} src={cookieImg}></img>
                                <ul>
                                    <li>it will copy the SID value <code>&lt;...&gt;</code> onto your clipboard for you</li>
                                </ul>
                            </ul>
                        </Collapse>


                        <li className="mt-1">
                            <span style={{cursor: "pointer"}} onClick={() => {setChrome(!chrome)}}>For Mobile <b><u>(Chrome/Firefox)</u></b></span>
                        </li>
                        <Collapse in={chrome}>
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
                        <li><i className="text-muted">To avoid spamming, syncing is only available once every 8 hours.</i>
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
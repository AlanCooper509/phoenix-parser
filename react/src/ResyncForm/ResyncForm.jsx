import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { BsChevronCompactDown } from "react-icons/bs";

import InfoModal from "./InfoModal";
import ResponseModal from "./ResponseModal";
import PlayerCard from "../Profile/PlayerCard";
import postSyncData from "../API/syncdata";
import checkUpdatedRecently from "../Helpers/checkUpdatedRecently";
import useGame from "../games/useGame";

const STATUS_CLASS = { success: "btn-success", error: "btn-danger" };
const STATUS_LABEL = { success: "Success!", error: "Failed" };

function SyncComplete({ result }) {
    const info = result.info; // player / number / title / last_updated
    return (
        <div>
            <h3 className="text-center">Data Sync: <span className="text-success">Complete</span></h3>
            <hr/>
            <PlayerCard
                info={info}
            />
            <hr/>
            <h4 className="mt-4">Synced data for&nbsp;
                <span className="Game-name">
                    {info.player} {info.number}
                </span>
                :
            </h4>
            <h4>
                <ul>
                    <li>
                        Best Scores: <code>{result.scores.toLocaleString()}</code>
                    </li>
                    <li>
                        Pumbility: <code>{result.pumbility.toLocaleString()}</code>
                    </li>
                    <li>
                        Titles: <code>{result.titles.toLocaleString()}</code>
                    </li>
                </ul>
            </h4>
            <i className="text-muted">(Your page will update when you close this message)</i>
        </div>
    );
}

function SyncFailed({ message }) {
    return (
        <div>
            <h3 className="text-center">Data Sync: <span className="text-danger">Failed</span></h3>
            <hr/>
            <p>{message}</p>
        </div>
    );
}

function ResyncForm({info, onSynced}) {
    // for info modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    // for response modal
    const [notify, setNotify] = useState(false);
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);
    // the synced user (same shape as GET /user), applied to the page when the message is closed
    const [syncedUser, setSyncedUser] = useState(null);
    const closeNotify = () => {
        setNotify(false);
        if (success) {
            if (syncedUser && onSynced) {
                onSynced(syncedUser);
            } else {
                window.location.reload();
            }
        }
    };
    const openNotify = (status, msg) => {setMessage(msg); setSuccess(status); setNotify(true)};

    // for submitting: "idle" | "loading" | "success" | "error"
    const [status, setStatus] = useState("idle");
    const [showForm, setShowForm] = useState(false);
    const sid = useRef(null);
    const params = useParams();
    const game = useGame();
    const name = params.name.toUpperCase();
    const number = params.number;
    const handleOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        handleSubmit();
    }
    async function handleSubmit() {
        if (status === "loading") { return; }
        if (!sid.current) { return };
        if (!sid.current.value) { return };
        // accept a pasted cookie string ("sid=...; ...") as well as the bare SID
        let input = sid.current.value;
        if (input.includes("sid=")) input = input.split("sid=")[1];
        if (input.includes(";")) input = input.split(";")[0];
        if (input.match(/[^a-zA-Z0-9]/g)) { return };

        setStatus("loading");
        try {
            const result = await postSyncData(game.id, name, number, input);
            localStorage.setItem('latestSync', JSON.stringify({...result.info, game: game.id}));
            setSyncedUser(result.user);
            setStatus("success");
            openNotify(true, <SyncComplete result={result}/>);
        } catch (error) {
            setStatus("error");
            openNotify(false, <SyncFailed message={error.message}/>);
        }
    }

    if (checkUpdatedRecently(info.timestamp, 8*60*60)) {
        return (<></>);
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
                            <Button className={`btn btn-sm border-dark ${STATUS_CLASS[status] || "btn-secondary"} ms-2`} onClick={handleSubmit}>
                                {status === "loading"
                                    ? <span className="spinner-border spinner-border-sm" role="status"></span>
                                    : <span>{STATUS_LABEL[status] || "Submit"}</span>}
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

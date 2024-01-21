import { useState } from "react";
import { useParams } from "react-router-dom";
import { ImNewTab } from "react-icons/im";

import './NewUser.css';
import InfoModal from "../ResyncForm/InfoModal";

function NewUser() {
    const params = useParams();
    const name = params.name.toUpperCase();
    const number = params.number;
    const hashNum = '#' + number;

    // for Info Modal
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = (e) => {e.preventDefault(); setShow(true)};

    return (
        <div className="container">
            <h3 className="my-4">
                Welcome!
            </h3>
            <h6 className="mb-4 ms-4">
                This user has not been registered yet or does not exist.
                <ul>
                    <li className="mt-2">
                        Try searching for another user?
                    </li>
                </ul>
            </h6>
            <hr/>
            <h5 className="mt-4 mb-3">
                If <b>you</b> are <b className="Player-font">{name} {hashNum}</b>:
            </h5>
            <h6>
                <ul>
                    <li className="mt-2">
                        To get started, use a Desktop/Laptop device to <b>Update Game Data</b> in the top right.
                    </li>
                    <li className="mt-2">
                        This will take a public snapshot of your PIU Phoenix data (Titles, Best Scores, Ranking points) and make pretty graphs and stat trackers with them.
                        <ul>
                            <li className="mt-2">
                                For example, see <a href="/user/TUSA/7085" target="_blank" rel="noreferrer">TUSA #7085<sup><ImNewTab /></sup></a>
                            </li>
                        </ul>
                    </li>
                    <li className="mt-2">
                        For more information:&nbsp;
                        <ul>
                            <li className="mt-2"><a href="/" style={{cursor: "pointer"}} onClick={handleShow}>Syncing your PIU Phoenix Data</a></li>
                        </ul>
                        <InfoModal 
                            show={show}
                            handleClose={handleClose}
                        />
                    </li>
                </ul>
            </h6>
            <h4>
            </h4>
        </div>
    );
}

export default NewUser;
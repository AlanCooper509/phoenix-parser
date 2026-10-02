import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { BsChevronCompactDown } from "react-icons/bs";

import getUsers from "../API/users";
import { userPath } from "../Helpers/paths";
import splitNameNumber from "../Helpers/splitNameNumber";
import UsersModal from "./UsersModal";

function validationChecks(formInput) {
    if (!formInput.current) { return; }
    if (!formInput.current.value) { return; }
    let tokens = splitNameNumber(formInput.current.value);
    if (!tokens) {
        tokens = { name: formInput.current.value };
    }
    if (!tokens.name) { return; }
    if (tokens.name.match(/[^a-zA-Z0-9]/g)) { return; }
    if (tokens.name.length > 12) { return; }
    if (tokens.number) { 
        if (isNaN(parseInt(tokens.number))) { return; }
        if (parseInt(tokens.number).toString().length !== 4) { return; }
    }
    return tokens;
}

const STATUS_CLASS = { success: "btn-success", error: "btn-danger" };
const STATUS_ICON = { success: "✓", error: "✕" };

function SearchUser({open}) {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [showForm, setShowForm] = useState(open);
    const [statusText, setStatusText] = useState('');
    // "idle" | "loading" | "success" | "error"
    const [status, setStatus] = useState("idle");
    const formInput = useRef(null);

    const handleCloseModal = () => setShowModal(false);
    const handleOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        handleSubmit();
    }
    async function searchByName(name) {
        setStatus("loading");
        let users;
        try {
            users = await getUsers(name);
        } catch (error) {
            setStatus("error");
            setStatusText(`Error! Try again later.`);
            return;
        }
        if (users.length === 0) {
            setStatus("error");
            setStatusText(`No users found!`);
            return;
        }
        setStatus("success");
        setStatusText(`Found ${users.length} user${users.length === 1 ? '' : 's'}!`);
        if (users.length === 1) {
            const user = users[0];
            navigate(userPath(user.info.player, user.info.number.slice(1)));
        } else {
            setModalData(users);
            setShowModal(true);
        }
    }
    const handleSubmit = () => {
        const tokens = validationChecks(formInput);
        if (!tokens) {
            setStatus("error");
            setStatusText("Invalid USER search");
            return;
        }
        setStatusText('');
        if (tokens.name && tokens.number) {
            setStatus("idle");
            navigate(userPath(tokens.name, tokens.number));
        } else if (tokens.name) {
            searchByName(tokens.name);
        }
    }

    let buttonContent = <FaMagnifyingGlass />;
    if (status === "loading") {
        buttonContent = <span className="spinner-border spinner-border-sm" role="status"></span>;
    } else if (STATUS_ICON[status] && statusText !== "Invalid USER search") {
        buttonContent = <div>{STATUS_ICON[status]}</div>;
    }
    return (
        <div className="container-fluid w-100 d-flex flex-column align-items-end">
            <span className="me-2 mb-2" style={{cursor: "pointer"}} onClick={() => {setShowForm(!showForm)}}>
                <BsChevronCompactDown style={{transform: `rotate(${showForm ? 180 : 0}deg)`}}/>&nbsp;&nbsp;Search User</span>
            <Collapse in={showForm}>
                <div>
                    <div className="d-flex flex-column">
                    <div className="d-flex">
                        <input ref={formInput} type="text" className="form-control me-2" onKeyDown={handleOnEnter} placeholder="USER #1234"/>
                        <Button className={`${STATUS_CLASS[status] || "btn-secondary"} btn-sm`} type="submit" onClick={handleSubmit}>{buttonContent}</Button>
                    </div>
                    {statusText}
                    </div>
                </div>
            </Collapse>
            <UsersModal
                show={showModal}
                handleClose={handleCloseModal}
                data={modalData}
            />
        </div>
    );
}

export default SearchUser;
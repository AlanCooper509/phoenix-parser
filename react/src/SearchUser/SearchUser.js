import { useState, useRef } from "react";
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { BsChevronCompactDown } from "react-icons/bs";

import getUsers from "../API/users";
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

function SearchUser({open}) {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState([]);
    const [showForm, setShowForm] = useState(open);
    const [statusText, setStatusText] = useState('');
    const formInput = useRef(null);
    const submitBtn = useRef(null);

    if (users.length === 1) {
        submitBtn.current.classList.add("btn-success");
        submitBtn.current.classList.remove("btn-secondary");
        let user = users[0];
        let player = user.info.player;
        let number = user.info.number.slice(1);
        window.location.href = `/user/${player}/${number}`;
    } else if (users.length > 1) {
        setShowModal(true);
        setModalData(users);
        setUsers([]);
    }

    const handleCloseModal = () => setShowModal(false);
    const handleOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        handleSubmit();
    }
    const handleSubmit = () => {
        const tokens = validationChecks(formInput);
        if (!tokens) {
            setStatusText("Invalid USER search");
            submitBtn.current.classList.add("btn-danger");
            submitBtn.current.classList.remove("btn-secondary");
            return;
        }
        if (tokens.name && tokens.number) {
            submitBtn.current.firstChild.innerHTML = '';
            submitBtn.current.firstChild.classList.add("spinner-border");
            submitBtn.current.firstChild.classList.add("spinner-border-sm");
            window.location.href = `/user/${tokens.name}/${tokens.number}`;
        } else if (tokens.name) {
            submitBtn.current.firstChild.innerHTML = '';
            submitBtn.current.firstChild.classList.add("spinner-border");
            submitBtn.current.firstChild.classList.add("spinner-border-sm");
            getUsers(setUsers, tokens.name, submitBtn, setStatusText);
        }
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
                        <Button ref={submitBtn} className="btn-secondary btn-sm" type="submit" onClick={handleSubmit}><FaMagnifyingGlass /></Button>
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
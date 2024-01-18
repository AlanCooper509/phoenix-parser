import { useState, useRef } from "react";
import Button from 'react-bootstrap/Button';
import Collapse from 'react-bootstrap/Collapse';
import { FaMagnifyingGlass } from "react-icons/fa6";
import { BsChevronCompactDown } from "react-icons/bs";

import splitNameNumber from "../Helpers/splitNameNumber";

function validationChecks(formInput) {
    if (!formInput.current) { return; }
    if (!formInput.current.value) { return; }
    const tokens = splitNameNumber(formInput.current.value);
    if (!tokens) { return; }
    if (!tokens.number) { return; }
    if (isNaN(parseInt(tokens.number))) { return; }
    if (tokens.number.length !== 4) { return; }
    if (!tokens.name) { return; }
    if (tokens.name.match(/[^a-zA-Z0-9]/g)) { return; }
    if (tokens.name.length > 12) { return; }
    return tokens;
}

function SearchUser({open}) {
    const [showForm, setShowForm] = useState(open);
    const formInput = useRef(null);

    const handleOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        handleSubmit();
    }
    const handleSubmit = () => {
        const tokens = validationChecks(formInput);
        if (!tokens) { return; }
        window.location.href = `/user/${tokens.name}/${tokens.number}`;
    }
    return (
        <div className="container-fluid w-100 d-flex flex-column align-items-end">
            <span className="me-2 mb-2" style={{cursor: "pointer"}} onClick={() => {setShowForm(!showForm)}}>
                <BsChevronCompactDown style={{transform: `rotate(${showForm ? 180 : 0}deg)`}}/>&nbsp;&nbsp;Search User</span>
            <Collapse in={showForm}>
                <div>
                    <div className="d-flex">
                        <input ref={formInput} type="text" className="form-control me-2" onKeyDown={handleOnEnter} placeholder="USER #1234"/>
                        <Button className="btn-secondary btn-sm" type="submit" onClick={handleSubmit}><FaMagnifyingGlass /></Button>
                    </div>
                </div>
            </Collapse>
        </div>
    );
}

export default SearchUser;
import React, { useState } from "react";

import getUser from "../../API/user.js";
import PlayerNameInput from "./PlayerNameInput.js";
import splitNameNumber from "../../Helpers/splitNameNumber.js";

function Sidebar({graphType, handleGraphToggle, infoP1, p2, p3, p4}) {
    const [infoP2, setInfoP2] = useState({});
    const [infoP3, setInfoP3] = useState({});
    const [infoP4, setInfoP4] = useState({});
    p2.info = infoP2;
    p2.setInfo = setInfoP2;
    p3.info = infoP3;
    p3.setInfo = setInfoP3;
    p4.info = infoP4;
    p4.setInfo = setInfoP4;
    
    function addPlayer(event) {
        let player;
        switch(event.target.getAttribute("name")) {
            case "p2":
                player = p2;
                break;
            case "p3":
                player = p3;
                break;
            case "p4":
                player = p4;
                break;
            default: 
                break;
        }
        let tokens = splitNameNumber(player.ref.current.value);
        if (!tokens) { return; }
        getUser(player.setInfo, player.setData, () => {return;}, () => {return;}, tokens.name, tokens.number);
    }

    return (
        <div className="container">
            <PlayerNameInput
                innerRef={p2.ref}
                label="Player 2"
                tag="p2"
                addPlayerHandler={addPlayer}
            />
            <PlayerNameInput
                innerRef={p3.ref}
                label="Player 3"
                tag="p3"
                addPlayerHandler={addPlayer}
            />
            <PlayerNameInput
                innerRef={p4.ref}
                label="Player 4"
                tag="p4"
                addPlayerHandler={addPlayer}
            />
            <div className="d-flex align-items-start mt-2">
                <label className="me-2" htmlFor="graphType">Select Stat:</label>
                <select ref={graphType} name="graphType" defaultValue="average" onInput={handleGraphToggle}>
                    <option value="average">Average Score</option>
                    <option value="clear">Percent Cleared</option>
                </select>
            </div>
        </div>
    );
}

export default Sidebar;
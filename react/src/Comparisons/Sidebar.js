import React, { useState } from "react";

import getUser from "../API/user.js";
import PlayerNameInput from "./PlayerNameInput.js";

function Sidebar({infoP1, p2, p3, p4}) {
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
        let splitter = " #";
        if (!player.ref.current.value.includes(splitter)) { splitter = "#"; }
        if (!player.ref.current.value.includes(splitter)) { return; }

        const name = player.ref.current.value.split(splitter)[0];
        const number = player.ref.current.value.split(splitter)[1];
        getUser(player.setInfo, player.setData, name, number);
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
        </div>
    );
}

export default Sidebar;
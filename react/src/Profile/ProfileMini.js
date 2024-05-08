import PlayerCardMini from './PlayerCardMini';
import './PlayerCard.css'

import splitNameNumber from "../Helpers/splitNameNumber";

function ProfileMini({info}) {
    function redirect() {
        const user = splitNameNumber(info.player + info.number);
        window.location.href = `/user/${user.name}/${user.number}`;
    }
    
    return (
        <>
        <div className="container-mini mt-3" onClick={redirect} style={{"minWidth": "400px", "maxHeight": "115px"}}>
            <div className="d-flex justify-content-between align-items-center ms-1 w-100">
                <div className="px-2 pt-2 mb-2 ms-1">
                    <PlayerCardMini
                        info={info}
                    />
                </div>
            </div>
            <i className="Update-mini position-relative ms-2" style={{bottom: "25px", float: "right", right: "10px"}}>
                Last Synced: {info.last_updated}
            </i>
        </div>
        </>
    );
}

export default ProfileMini;
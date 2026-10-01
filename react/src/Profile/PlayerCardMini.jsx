import './PlayerCard.css'

import { avatarImg } from '../Helpers/assets';

function PlayerCardMini({info}) {
    const titleClasses = "Game-title-mini " + (info && info.title ? info.title.color : "");
    const profilePic = info && info.avatar ? info.avatar : avatarImg("phx1");
    return (
    <div className="d-flex justify-content-center align-items-center">
        <div>
            <img 
                className="Profile-pic-mini"
                src={profilePic}
                alt="Phoenix Profile"
            />
        </div>
        <div className="Game-info-mini">
            <div className={titleClasses}>
                {info.title.text}
            </div>
            <div className="Game-id-mini">
                {info.player.toUpperCase()}
            </div>
            <span className="Game-id-mini number-mini">{info.number}</span>
        </div>
    </div>
    );
}

export default PlayerCardMini;
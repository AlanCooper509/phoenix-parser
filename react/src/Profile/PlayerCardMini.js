import './PlayerCard.css'

function PlayerCardMini({info}) {
    const titleClasses = "Game-title-mini " + (info && info.title ? info.title.color : "");
    return (
    <div className="d-flex justify-content-center align-items-center">
        <div>
            <img 
                className="Profile-pic-mini"
                src="https://www.piugame.com/data/avatar_img/4f617606e7751b2dc2559d80f09c40bf.png"
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
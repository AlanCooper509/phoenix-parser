import './PlayerCard.css'

function PlayerCard({info}) {
    const titleClasses = "Game-title " + (info && info.title ? info.title.color : "");
    const profilePic = info && info.avatar ? info.avatar : "https://www.piugame.com/data/avatar_img/4f617606e7751b2dc2559d80f09c40bf.png";
    return (
    <div className="d-flex justify-content-center align-items-center">
        <a href="/">
            <img 
                className="Profile-pic"
                src={profilePic}
                alt="Phoenix Profile"
            />
        </a>
        <div className="Game-info">
            <div className={titleClasses}>
                {info.title.text}
            </div>
            <div className="Game-id">
                {info.player.toUpperCase()} {info.number}
            </div>
            <i className="Update">
                Last Synced: {info.last_updated}
            </i>
        </div>
    </div>
    );
}

export default PlayerCard;
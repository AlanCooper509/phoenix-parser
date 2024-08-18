import './PlayerCard.css'

function PlayerCard({info}) {
    const titleClasses = "Game-title " + (info && info.title ? info.title.color : "");
    let thumbnail = '';
    if (info.last_updated !== 'Unknown') {
        let profilePic = "https://www.piugame.com/data/avatar_img/4f617606e7751b2dc2559d80f09c40bf.png";
        if (info.avatar) {
            profilePic = info.avatar;
        }
        thumbnail = 
        <img 
            className="Profile-pic"
            src={profilePic}
            alt="Phoenix Profile"
        />
    } else {
        thumbnail = 
        <div className="Profile-pic d-flex justify-content-center align-items-center">
            <div className="spinner-border" role="status">
                <span className="sr-only"></span>
            </div>
        </div>
    }
    return (
    <div className="d-flex justify-content-center align-items-center">
        <a href="/">
            {thumbnail}
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
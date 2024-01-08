import './Profile.css'

function Profile({info}){
    return (
    <div className="Profile d-flex px-2 pt-2">
        <div>
            <img 
                className="Profile-pic"
                src="https://www.piugame.com/data/avatar_img/4f617606e7751b2dc2559d80f09c40bf.png"
                alt="Phoenix Profile"
            />
        </div>
        <div className="Game-info">
            <div className="Game-title">
                {info.title}
            </div>
            <div className="Game-id">
                {info.player}
            </div>
            <i className="Update">
                Last Synced: {info.last_updated}
            </i>
        </div>
    </div>
    )
}

export default Profile;
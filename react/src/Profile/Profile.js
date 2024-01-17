import './Profile.css'

import ResyncForm from '../ResyncForm/ResyncForm';

function Profile({info}){
    return (
        <div className="d-flex justify-content-between align-items-center mt-1 ms-1">
            <div className="d-flex px-2 pt-2 align-items-center">
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
                        {info.player} {info.number}
                    </div>
                    <i className="Update">
                        Last Synced: {info.last_updated}
                    </i>
                </div>
            </div>
            <div className="mt-3 me-4">
                <ResyncForm/>
            </div>
        </div>
    )
}

export default Profile;
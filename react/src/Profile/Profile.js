import PlayerCard from './PlayerCard';
import SearchUser from '../SearchUser/SearchUser';

function Profile({info}){
    return (
        <div className="d-flex justify-content-between align-items-center mt-1 ms-1">
            <div className="px-2 pt-2">
                <PlayerCard
                    info={info}
                />
            </div>
            <div className="mt-3 me-4">
            <SearchUser>

            </SearchUser>
            </div>
        </div>
    )
}

export default Profile;
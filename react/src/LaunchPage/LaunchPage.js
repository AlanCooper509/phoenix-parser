import React, {useState, useEffect} from 'react';

import SearchUser from "../SearchUser/SearchUser";
import getUsers from "../API/users";
import ProfileMini from '../Profile/ProfileMini';

function LaunchPage() {
    const [users, setUsers] = useState([]);
    useEffect(() => getUsers(setUsers), []);

    let userlist = [];
    for (const entry of users) {
        userlist.push(
            <ProfileMini
                info={entry.info}
                key={entry.info.player + entry.info.number}
            />
        );
    }

    return (
        <div className="container mt-4">
            <SearchUser
                open={true}
            />
            <h3 className="ms-2 mt-4">Welcome!</h3>
            <h5 className="ms-4 mt-3">Search for a USER to get started.</h5>
            <hr className="mt-5"/>
            <div className="ms-2 mt-4">
                <h5>User Database:</h5>
                <div className="container">
                    {userlist}
                </div>
            </div>
        </div>
    );
}

export default LaunchPage;
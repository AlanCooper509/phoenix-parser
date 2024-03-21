import React, {useState, useEffect} from 'react';

import SearchUser from "../SearchUser/SearchUser";
import getUsers from "../API/users";
import ProfileMini from '../Profile/ProfileMini';

function LaunchPage() {
    const [users, setUsers] = useState([]);
    useEffect(() => getUsers(setUsers), []);

    let userlist_today = [];
    let userlist_weekly = [];
    let userlist_remaining = [];
    for (const entry of users) {
        if (entry.info.timestamp > Date.now()/1000 - 60*60*24) {
            userlist_today.push(
                <ProfileMini
                    info={entry.info}
                    key={entry.info.player + entry.info.number}
                />
            );
        } else if (entry.info.timestamp > Date.now()/1000 - 60*60*24*7) {
            userlist_weekly.push(
                <ProfileMini
                    info={entry.info}
                    key={entry.info.player + entry.info.number}
                />
            );
        } else {
            userlist_remaining.push(
                <ProfileMini
                    info={entry.info}
                    key={entry.info.player + entry.info.number}
                />
            );            
        }
    }

    const spinner = <div className="mb-4"><div className="spinner-border spinner-border-sm" role="status"><span className="sr-only"></span></div> Loading...</div>;
    const dailyUsers = users.length > 0 ? userlist_today : spinner;
    const weeklyUsers = users.length > 0 ? userlist_weekly : spinner;
    const remainingUsers = users.length > 0 ? userlist_remaining : spinner;

    const dailyUserCount = users.length > 0 ? `(${userlist_today.length})` : '';
    const weeklyUserCount = users.length > 0 ? `(${userlist_weekly.length})` : '';
    const remainingUserCount = users.length > 0 ? `(${userlist_remaining.length})` : '';
    const totalUserCount = users.length > 0 ? `(${users.length})` : '';

    return (
        <div className="container mt-4">
            <SearchUser
                open={true}
            />
            <h3 className="ms-2 mt-4">Welcome!</h3>
            <h5 className="ms-4 mt-3">Search for a USER to get started.</h5>
            <li className="ms-4 mt-3">New here? Set up your own PIU profile using the search bar!</li>
            <hr className="mt-5"/>
            <h4 className="ms-2 mt-4">User Database {totalUserCount}</h4>
            <div className="container">
                <div className="row">
                    <div className="col-xl-4 mt-3">
                        <h5 className="ms-2">Last 24 Hours {dailyUserCount}</h5>
                        <div className="container">
                            {dailyUsers}
                        </div>
                    </div>
                    <div className="col-xl-4 mt-3">
                        <h5 className="ms-2">Last 7 Days {weeklyUserCount}</h5>
                        <div className="container">
                            {weeklyUsers}
                        </div>
                    </div>
                    <div className="col-xl-4 mt-3">
                        <h5 className="ms-2">Remaining Profiles {remainingUserCount}</h5>
                        <div className="container">
                            {remainingUsers}
                        </div>
                    </div>
                </div>
            </div>
            <hr className="mt-5"/>
        </div>
    );
}

export default LaunchPage;
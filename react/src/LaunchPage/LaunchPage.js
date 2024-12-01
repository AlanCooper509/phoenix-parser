import React, {useState, useEffect} from 'react';

import SearchUser from "../SearchUser/SearchUser";
import getUsers from "../API/users";
import ProfileMini from '../Profile/ProfileMini';
import calculateZoomLevel from '../Helpers/calculateZoomLevel';

function LaunchPage() {
    const minWidth = 480;
    const [users, setUsers] = useState([]);
    useEffect(() => getUsers(setUsers), []);
    const zoomLevel = calculateZoomLevel(minWidth);

    let welcomeText = "Welcome!";
    let starterText = "Search for a USER to get started.";
    let latestSyncOutput = (<></>);
    let newUserOutput = (<>
            <li className="ms-4 mt-3"><b>New Here?</b></li>
            <ul>
                <li>Set up your own PIU profile by using the search bar!</li>
            </ul>
        </>
    );
    
    const latestSync = localStorage.getItem("latestSync");
    if (latestSync) {
        const latestInfo = JSON.parse(latestSync);
        welcomeText = `Welcome back, ${latestInfo.player}!`
        starterText += " Your latest sync was:";
        latestSyncOutput = (
            <div className="row ms-4">
                <span className="row ms-2">
                    <ProfileMini info={latestInfo} />
                </span>
            </div>
        );
        newUserOutput = (<></>);
    }

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
        <div className="container mt-4" style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left'}}>
            <SearchUser open={true} />
            <h3 className="ms-2 mt-4">{welcomeText}</h3>
            <h5 className="ms-4 mt-3">{starterText}</h5>
            {latestSyncOutput}
            <ul className="mt-">
                {newUserOutput}
                <li className="ms-4 mt-3"><b>Troubleshooting?</b></li>
                <ul>
                    <li>Reach out to <b>u/PureWasian</b> on Reddit.</li>
                </ul>
                <li className="ms-4 mt-3"><b>Recent Updates</b></li>
                <ul>
                    <li>(12/01/24) Safari/iPhone users rejoice ~ tweaked the text sizing issues, among other QoL changes</li>
                    <li>(10/31/24) When sync is successful, the page will now auto-refresh upon closing the notification. Also, you can see who your latest sync was!</li>
                    <li>(09/23/24) <b>Breakdown: Show Uncleared</b> properly tracks Co-Op clears, and supports Korean syncs now.</li>
                    <li>(08/19/24) Pumbility support on the Overivew page. Tap the Pumbility number on a user page to show the specific charts.</li>
                </ul>
            </ul>
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
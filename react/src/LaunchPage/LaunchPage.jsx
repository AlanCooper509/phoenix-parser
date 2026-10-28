import React, {useState, useEffect, useMemo} from 'react';
import Snowfall from 'react-snowfall'
import { Link } from 'react-router-dom';

import SearchUser from "../SearchUser/SearchUser";
import getUsers from "../API/users";
import ProfileMini from '../Profile/ProfileMini';
import calculateZoomLevel from '../Helpers/calculateZoomLevel';
import isWinterTheme from '../Helpers/isWinter';
import useGame from '../games/useGame';

function LaunchPage() {
    const minWidth = 480;
    const game = useGame();
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('');
    useEffect(() => {
        getUsers(game.id).then(setUsers).catch(() => setUsers([]));
    }, [game.id]);

    const [zoomLevel, setZoomLevel] = useState(calculateZoomLevel(minWidth));
    useEffect(() => {
        const handleResize = () => {
          setZoomLevel(calculateZoomLevel(minWidth));
        };
        window.addEventListener("resize", handleResize);
        return () => { window.removeEventListener("resize", handleResize); };
      }, []
    );

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
    
    // Phoenix 2 syncs are saved under their own key now, but older ones were saved here too: skip those
    const latestSync = localStorage.getItem("latestSync");
    const latestInfo = latestSync ? JSON.parse(latestSync) : null;
    if (latestInfo && latestInfo.game !== "phx2") {
        welcomeText = `Welcome back, ${latestInfo.player}!`
        starterText += " Your latest sync was:";
        latestSyncOutput = (
            <div className="row ms-4">
                <span className="row ms-2">
                    <ProfileMini info={latestInfo} gameId={latestInfo.game} />
                </span>
            </div>
        );
        newUserOutput = (<></>);
    }

    // Phoenix 1 is past end of life, so one list of every profile (most recently synced first)
    // filtered by name, instead of separate columns by sync date
    const shownUsers = useMemo(() => {
        const query = filter.replace(/\s+/g, '').toUpperCase();
        return users
            .filter((entry) => !query || (entry.info.player + entry.info.number).includes(query))
            .sort((a, b) => (b.info.timestamp || 0) - (a.info.timestamp || 0));
    }, [users, filter]);
    const spinner = <div className="mb-4"><div className="spinner-border spinner-border-sm" role="status"><span className="sr-only"></span></div> Loading...</div>;
    const totalUserCount = users.length > 0 ? `(${users.length})` : '';

    let snow = <></>
    if (isWinterTheme()) {
        snow = <Snowfall
            snowflakeCount={75}
            wind={[-0.3, 0.7]}
            speed={[0.8, 1.3]}
            radius={[1.0, 2.0]}
        />
    }

    return (
        <div className="container mt-4" style={{minWidth: `${minWidth}px`, transform: `scale(${zoomLevel})`, transformOrigin: 'top left'}}>
            <div className="position-relative">
                {snow}
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
                        <li>(10/27/26) <Link to="/" className="legacy-link">Phoenix 2</Link> is now the main site at piutracker.app. This Phoenix 1 tracker stays here as a legacy version.</li>
                        <li>(07/02/26) This will continue to sync with phoenix.piugame.com for now -- stay tuned for Phoenix 2 integration soon! </li>
                        <li>(04/05/24) Added support for 1948 Lv.?? as a Lv.29 chart, (but no clue on how it would get parsed yet!) </li>
                        <li>(12/01/24) Safari/iPhone users rejoice ~ text sizing issues have been tweaked, among some other formatting QoL changes</li>
                        <li>(10/31/24) When sync is successful, the page will now auto-refresh upon closing the notification. Also, you can see who your latest sync was!</li>
                        <li>(09/23/24) <b>Breakdown: Show Uncleared</b> properly tracks Co-Op clears.</li>
                        <li>(08/19/24) Pumbility support on the Overivew page. Tap the Pumbility number on a user page to show the specific charts.</li>
                    </ul>
                </ul>
                <hr className="mt-5"/>
            </div>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-4 mx-2">
                <h4 className="mb-0">User Database {totalUserCount}</h4>
                <input
                    type="text" className="form-control" style={{maxWidth: "280px"}} placeholder="Filter by name"
                    value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter users by name"
                />
            </div>
            <div className="container mt-3">
                {users.length === 0 ? spinner : (
                    // columns sized to the cards themselves (350px, their narrowest), so the gaps between them
                    // stay even at any width (Bootstrap columns left strips beside, or overflow under, them)
                    <div className="user-grid">
                        {shownUsers.map((entry) => (
                            <ProfileMini info={entry.info} key={entry.info.player + entry.info.number}/>
                        ))}
                        {shownUsers.length === 0 && <p className="ms-2 mt-3 text-muted">No users match that name.</p>}
                    </div>
                )}
            </div>
            <hr className="mt-5"/>
        </div>
    );
}

export default LaunchPage;
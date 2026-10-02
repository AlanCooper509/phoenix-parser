import React, {useState, useEffect} from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Snowfall from 'react-snowfall'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import './UserPage.css';
import NewUser from './NewUser';
import LoadingUser from './LoadingUser';

import getUser, { newUserInfo } from '../API/user.js';
import getChartStats from '../API/chartstats.js';
import { userPath } from '../Helpers/paths.js';
import Profile from '../Profile/Profile';
import ResyncForm from '../ResyncForm/ResyncForm';
import Overview from '../Tabs/Overview/Overview.jsx';
import Breakdown from '../Tabs/Breakdown/Breakdown.jsx';
import Progression from '../Tabs/Progression/Progression.jsx';
import Comparisons from '../Tabs/Comparisons/Comparisons';
import checkUpdatedRecently from '../Helpers/checkUpdatedRecently.js';
import calculateZoomLevel from '../Helpers/calculateZoomLevel.js';
import isWinterTheme from '../Helpers/isWinter.js';

function UserPage() {
    const params = useParams();
    const name = params.name;
    const number = params.number;
    const navigate = useNavigate();
    // the URL is the source of truth for the tab, so back/forward also switch tabs
    const activeTab = params.tab || "overview";
    const hashNum = '#' + number;
    const minWidth = 800;

    function updateUrl(tab) {
        navigate(userPath(name, number, tab));
    }

    const [info, setInfo] = useState({player: name, number: hashNum, title: {text: "", color: ""}, last_updated: "Unknown"});
    const [data, setData] = useState([]);
    const [titles, setTitles] = useState([]);
    const [pumbility, setPumbility] = useState([]);
    
    useEffect(() => {
        getUser(name, number)
            .then((user) => {
                setInfo(user.info);
                setData(user.scores);
                setTitles(user.titles);
                setPumbility(user.pumbility);
            })
            .catch(() => setInfo(newUserInfo(name, number)));
    }, [name, number]);

    // chart counts per level, shared by the Breakdown and Progression tabs
    const [chartStats, setChartStats] = useState({});
    useEffect(() => {
        getChartStats()
            .then(setChartStats)
            .catch((error) => console.error('Error fetching chart stats:', error));
    }, []);

    const [zoomLevel, setZoomLevel] = useState(calculateZoomLevel(minWidth));
    useEffect(() => {
        const handleResize = () => {
          setZoomLevel(calculateZoomLevel(minWidth));
        };
        window.addEventListener("resize", handleResize);
        return () => { window.removeEventListener("resize", handleResize); };
      }, []
    );

    const hideResync = info.last_updated === "Unknown" || checkUpdatedRecently(info.timestamp, 8*60*60);
    const resyncForm =  hideResync ? <></> :
                        <div className="container overlap-bottom">
                            <ResyncForm
                                info={info}
                            />
                        </div>

    let snow = <></>
    if (isWinterTheme()) {
        snow = <Snowfall
            snowflakeCount={25}
            wind={[-0.3, 0.6]}
            speed={[0.5, 0.8]}
            radius={[1.0, 2.0]}
        />
    }

    return (
        <div className="UserPage" style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
            <div className="position-relative">
                {snow}
                <Profile info={info}/>
            </div>
            <hr/>
            { resyncForm }
            { info.last_updated === "Never" ? 
            <NewUser/>
            : info.last_updated === "Unknown" ?
            <LoadingUser name={name} hashNum={hashNum}/>
            :
            <div className="container" style={{minWidth: "800px"}}>
                <Tabs activeKey={activeTab} id="navtabs" className="mb-3" onSelect={updateUrl}>
                    <Tab eventKey="overview" title="Overview">
                        <Overview info={info} data={data} titles={titles} pumbility={pumbility}/>
                    </Tab>
                    <Tab eventKey="breakdown" title="Breakdown">
                        <Breakdown info={info} data={data} chartData={chartStats}/>
                    </Tab>
                    <Tab eventKey="progression" title="Progression">
                        <Progression data={data} titles={titles} chartData={chartStats}/>
                    </Tab>
                    <Tab eventKey="comparisons" title="Comparisons">
                        <Comparisons info={info} data={data}/>
                    </Tab>
                </Tabs>
            </div>

            }
            <hr/>
        </div>
    );
}

export default UserPage;
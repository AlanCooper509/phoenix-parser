import React, {useState, useEffect} from 'react';
import { useParams } from "react-router-dom";
import Snowfall from 'react-snowfall'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import './UserPage.css';
import NewUser from './NewUser';
import LoadingUser from './LoadingUser';

import getUser from '../API/user.js';
import Profile from '../Profile/Profile';
import ResyncForm from '../ResyncForm/ResyncForm';
import Overview from '../Tabs/Overview/Overview.js';
import Breakdown from '../Tabs/Breakdown/Breakdown.js';
import Progression from '../Tabs/Progression/Progression.js';
import Comparisons from '../Tabs/Comparisons/Comparisons';
import checkUpdatedRecently from '../Helpers/checkUpdatedRecently.js';
import calculateZoomLevel from '../Helpers/calculateZoomLevel.js';
import constants from '../Helpers/constants.json';

function UserPage() {
    const params = useParams();
    const name = params.name;
    const number = params.number;
    let [activeTab, setActiveTab] = useState(params.tab || "overview");
    const hashNum = '#' + number;
    const minWidth = 800;

    function updateUrl(tab) {
        const newPath = `${window.location.pathname.split('/').slice(0, 4).join('/')}/${tab}`;
        window.history.pushState(null, '', newPath);
        setActiveTab(tab);
    }    

    const [info, setInfo] = useState({player: name, number: hashNum, title: {text: "", color: ""}, last_updated: "Unknown"});
    const [data, setData] = useState([]);
    const [titles, setTitles] = useState([]);
    const [pumbility, setPumbility] = useState([]);
    
    useEffect(() => getUser(setInfo, setData, setTitles, setPumbility, name, number), [name, number]);

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
    if (constants.winterTheme) {
        <Snowfall
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
                        <Breakdown info={info} data={data}/>
                    </Tab>
                    <Tab eventKey="progression" title="Progression">
                        <Progression data={data} titles={titles}/>
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
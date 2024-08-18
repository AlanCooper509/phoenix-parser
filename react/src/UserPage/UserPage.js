import React, {useState, useEffect} from 'react';
import { useParams } from "react-router-dom";

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

function resize() {
    // Set the min-width based on your requirement
    const minScreenWidth = 800;
  
    // Get the device width
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    
    // Apply the zoom level to the body
    if(screenWidth < minScreenWidth) {
        const zoomLevel = screenWidth / minScreenWidth;
        document.body.style.zoom = zoomLevel;
    }
};

function UserPage() {
    const params = useParams();
    const name = params.name;
    const number = params.number;
    const hashNum = '#' + number;

    const [info, setInfo] = useState({player: name, number: hashNum, title: {text: "", color: ""}, last_updated: "Unknown"});
    const [data, setData] = useState([]);
    const [titles, setTitles] = useState([]);
    
    useEffect(() => getUser(setInfo, setData, setTitles, name, number), [name, number]);
    resize();

    const hideResync = info.last_updated === "Unknown" || checkUpdatedRecently(info.timestamp, 8*60*60);
    const resyncForm =  hideResync ? <></> :
                        <div className="container overlap-bottom">
                            <ResyncForm
                                info={info}
                            />
                        </div>

    return (
        <div className="UserPage">
            <Profile info={info}/>
            <hr/>
            { resyncForm }
            { info.last_updated === "Never" ? 
            <NewUser/>
            : info.last_updated === "Unknown" ?
            <LoadingUser name={name} hashNum={hashNum}/>
            :
            <div className="container">
                <Tabs defaultActiveKey="overview" id="navtabs" className="mb-3">
                    <Tab eventKey="overview" title="Overview">
                        <Overview info={info} data={data} titles={titles}/>
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
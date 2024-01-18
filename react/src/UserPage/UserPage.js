import React, {useState, useEffect} from 'react';
import { useParams } from "react-router-dom";

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

import './UserPage.css';

import getUser from '../API/user.js';
import Comparisons from '../Comparisons/Comparisons';
import Overview from '../Overview/Overview';
import Profile from '../Profile/Profile';
import Progression from '../Progression/Progression';

function UserPage() {
    const params = useParams();
    const name = params.name;
    const number = params.number;
    const hashNum = '#' + number;

    const [info, setInfo] = useState({player: name, number: hashNum, title: {text: "", color: ""}, last_updated: "Unknown"});
    const [data, setData] = useState([]);
    const [titles, setTitles] = useState([]);
    
    useEffect(() => getUser(setInfo, setData, setTitles, name, number), []);

    return (
        <div className="UserPage">
            <Profile info={info}/>
            <hr/>
            <div className="container">
            <Tabs
            defaultActiveKey="overview"
            id="navtabs"
            className="mb-3"
            >
            <Tab eventKey="overview" title="Overview">
                <Overview info={info} data={data} titles={titles}/>
            </Tab>
            <Tab eventKey="comparisons" title="Comparisons">
                <Comparisons info={info} data={data}/>
            </Tab>
            <Tab eventKey="progression" title="Progression">
                <Progression info={info} data={data}/>
            </Tab>
            </Tabs>
            </div>
            <hr/>
        </div>
    );
}

export default UserPage;
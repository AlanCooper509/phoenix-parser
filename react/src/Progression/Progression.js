import React, { useEffect, useState } from "react";
import Accordion from 'react-bootstrap/Accordion';

import getChartStats from '../API/chartstats.js';
import LevelStats from './LevelStats.js';
import cutoffs from "./TitleCutoffs.json";

function Progression({info, data}) {
    const [chartData, setChartData] = useState({});
    useEffect(() => getChartStats(setChartData), []);

    const intermediateLevels = [];
    for (const key in cutoffs) {
        intermediateLevels.push(
            <LevelStats
                cutoffs={ cutoffs[key] }
                rating={ data[key] ? data[key].rating : 0 }
                singles={data[key] ? data[key].singles.count : 0}
                doubles={data[key] ? data[key].doubles.count : 0}
                charts={chartData[key]}
                level={ key }
                key={ key }
            />
        );
        if (key === cutoffs.length - 1) { continue; }
        intermediateLevels.push(<hr key={-key}/>)
    }

    return (
        <div className="container">
            <h3>Title Progression</h3>
            <Accordion alwaysOpen>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Intermediate Trackers</Accordion.Header>
                    <Accordion.Body>
                        {intermediateLevels}
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                    <Accordion.Header>Advanced Trackers</Accordion.Header>
                    <Accordion.Body>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                        minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                        aliquip ex ea commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum.
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                    <Accordion.Header>Expert Trackers</Accordion.Header>
                    <Accordion.Body>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                        eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                        minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                        aliquip ex ea commodo consequat. Duis aute irure dolor in
                        reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
                        pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                        culpa qui officia deserunt mollit anim id est laborum.
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}

export default Progression;
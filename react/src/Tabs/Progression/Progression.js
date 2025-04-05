import React, { useEffect, useState } from "react";
import Accordion from 'react-bootstrap/Accordion';

import getChartStats from '../../API/chartstats.js';
import LevelStats from './LevelStats.js';
import cutoffs from "./TitleCutoffs.json";

function Progression({data, titles}) {
    const [chartData, setChartData] = useState({});
    useEffect(() => getChartStats(setChartData), []);

    let levels = {
        intermediate: [],
        advanced: [],
        expert: []
    }
    for (const category in cutoffs) {
        for (const key in cutoffs[category]) {
            levels[category].push(
                <LevelStats
                    cutoffs={ cutoffs[category][key] }
                    rating={ data[key] ? data[key].rating : 0 }
                    singles={data[key] ? data[key].singles.count : 0}
                    doubles={data[key] ? data[key].doubles.count : 0}
                    charts={chartData[key]}
                    level={ key }
                    key={ key }
                />
            );
            if (["19", "22", "29"].includes(key)) { continue; /* skip adding <hr/> to the bottom of each category */}
            levels[category].push(<hr key={-key}/>)
        }
    }

    // default: show intermediate titles
    let showSectionsWithKeys = ['1'];
    if (Array.isArray(titles) && titles.includes("INTERMEDIATE Lv.10")) {
        // only show advanced titles
        showSectionsWithKeys = ['2'];
    } else {
        for (const level of ["20", "21", "22"]) {
            if (level in data) {
                showSectionsWithKeys.push('2');
            }
        }
    }
    if (Array.isArray(titles) && titles.includes("ADVANCED Lv.10")) {
        // only show expert titles
        showSectionsWithKeys = ['3'];
    } else {
        for (const level of ["23", "24", "25", "26", "27", "28", "29"]) {
            if (level in data) {
                showSectionsWithKeys.push('3');
            }
        }
    }

    return (
        <div className="container">
            <h3 className="mb-3">Title Progression</h3>
            <Accordion defaultActiveKey={showSectionsWithKeys} alwaysOpen>
                <Accordion.Item eventKey="1" >
                    <Accordion.Header>Intermediate Trackers</Accordion.Header>
                    <Accordion.Body>
                        {levels.intermediate}
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="2">
                    <Accordion.Header>Advanced Trackers</Accordion.Header>
                    <Accordion.Body>
                        {levels.advanced}
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="3">
                    <Accordion.Header>Expert Trackers</Accordion.Header>
                    <Accordion.Body>
                        {levels.expert}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}

export default Progression;
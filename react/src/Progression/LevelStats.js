import React, { useState } from "react";
import { TbInfoCircle } from "react-icons/tb";
import BarChart from "./BarChart.js";
import { BsChevronCompactDown } from "react-icons/bs";
import Collapse from 'react-bootstrap/Collapse';

import "./LevelStats.css";

function LevelStats({cutoffs, rating, singles, doubles, charts, level}) {
    let titles = [];
    for (const idx in cutoffs) {
        let title = cutoffs[idx];
        const titleClasses = `mb-1 font-title font-${title.tier}`;
        titles.push(
            <div key={idx} className="mt-3 ms-2">
                <h4 className={titleClasses}>{title.header}</h4>
                <div className="mb-4 small-text"><TbInfoCircle/> {title.description}</div>
            </div>
        );
    }
    const cutoff = 0;
    const [open, setOpen] = useState(titles.length <= cutoff);
    return (
        <div className="container">
            <div className="row align-items-center">
                <div className="col-4">
                {titles.length > cutoff ?
                    <h4 style={{cursor: "pointer"}} onClick={() => {setOpen(!open)}}>
                        <BsChevronCompactDown style={{transform: `rotate(${open ? 180 : 0}deg)`}}/> LEVEL {level}
                    </h4> : 
                    <h4>
                        LEVEL {level}
                    </h4>
                }
                    <Collapse in={open}>
                        <div>
                        {titles}
                        </div>
                    </Collapse>
                </div>
                <div className="col-8 text-start">
                    <span className="float-end me-2 d-flex align-items-center">
                        <img className="stepball" src="https://www.piugame.com/l_img/stepball/full/s_bg.png"/>
                        <span className="ms-1 me-3"><b className="h3">{singles}</b>/{charts ? charts.singles : 0}</span>
                        <img className="stepball" src="https://www.piugame.com/l_img/stepball/full/d_bg.png"/>
                        <span className="ms-1 me-2"><b className="h3">{doubles}</b>/{charts ? charts.doubles : 0}</span>
                    </span>
                    <h4 className="">Rating: {rating.toLocaleString()}</h4>
                    <BarChart
                        cutoffs={cutoffs}
                        rating={rating}
                    />
                </div>
            </div>
        </div>
    );
}

export default LevelStats;
import React, { useState } from "react";
import { TbInfoCircle } from "react-icons/tb";
import BarChart from "./BarChart.js";
import { BsChevronCompactDown } from "react-icons/bs";
import Collapse from 'react-bootstrap/Collapse';

import "./LevelStats.css";

function renderStatusText(cutoffs, rating, singles, doubles) {
    const currentCount = singles + doubles;
    const ratingPerChart = rating/currentCount;

    if (isNaN(ratingPerChart)) {
        return <ul>No data points yet!</ul>;
    }

    const nextCutoff = cutoffs.find(cutoff => cutoff.value > rating)
    if (!nextCutoff) {
        return <ul className="text-success"><strong>Titles Achieved!</strong></ul>;
    }

    const estimate = Math.ceil((nextCutoff.value - rating)/ratingPerChart);
    return <ul>Estimated: <strong className="fs-5 text-warning">{estimate}</strong> clears to title!</ul>;
}

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
    const [open, setOpen] = useState(false);
    const levelStatusText = open ? "" : renderStatusText(cutoffs, rating, singles, doubles);
    return (
        <div className="container">
            <div className="row align-items-center">
                <div className="col-4">
                    <h4 style={{cursor: "pointer"}} onClick={() => {setOpen(!open)}}>
                        <BsChevronCompactDown style={{transform: `rotate(${open ? 180 : 0}deg)`}}/> LEVEL {level}
                    </h4>
                    <div className="text-muted">{levelStatusText}</div>
                    <Collapse in={open}>
                        <div>
                        {titles}
                        </div>
                    </Collapse>
                </div>
                <div className="col-8 text-start">
                    <span className="float-end me-2 d-flex align-items-center">
                        <img alt="singles" className="stepball" src="/images/stepball/s_bg.png"/>
                        <span className="ms-1 me-3"><b className="h3">{singles}</b>/{charts ? charts.singles : 0}</span>
                        <img alt="doubles" className="stepball" src="/images/stepball/d_bg.png"/>
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
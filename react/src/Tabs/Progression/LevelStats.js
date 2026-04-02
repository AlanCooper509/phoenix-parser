import React, { useState } from "react";
import { TbInfoCircle } from "react-icons/tb";
import BarChart from "./BarChart.js";
import { BsChevronCompactDown } from "react-icons/bs";
import Collapse from 'react-bootstrap/Collapse';

import "./LevelStats.css";

function renderStatusText(cutoffs, rating, singles, doubles) {
    if (!cutoffs || !Array.isArray(cutoffs)) {
        return (
            <ul className="text-muted italic">
                Levels under 10 do not grant Title progress.
            </ul>
        );
    }

    const currentCount = singles + doubles;

    if (currentCount === 0 || !rating) {
        return (
            <div className="mt-2 py-2 px-3 rounded bg-dark bg-opacity-25 border-start border-end border-secondary border-3">
                <div className="d-flex align-items-center">
                    <i className="bi bi-info-circle text-muted me-3 fs-4"></i>
                    <div>
                        <span className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05rem' }}>
                            Status
                        </span>
                        <div className="text-muted small">No clears recorded for this level.</div>
                    </div>
                </div>
            </div>
        );
    }

    const ratingPerChart = rating / currentCount;
    const nextCutoff = cutoffs.find(cutoff => cutoff.value > rating);

    if (!nextCutoff) {
        return (
            <div className="mt-2 py-2 px-3 rounded bg-dark bg-opacity-25 border-start border-end border-success border-3">
                <div className="d-flex align-items-center justify-content-between">
                    
                    {/* Left Side: Completion Info */}
                    <div className="flex-grow-1">
                        <span className="text-uppercase text-success fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05rem', lineHeight: '1' }}>
                            Requirement Met
                        </span>
                        <div className="mt-1 d-flex align-items-center">
                            <i className="bi bi-patch-check-fill text-success me-2"></i>
                            <span className="text-light fw-bold lh-1">All Titles Achieved!</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const pointsNeeded = nextCutoff.value - rating;
    const estimate = Math.ceil(pointsNeeded / ratingPerChart);

    return (
        <div className="mt-2 py-2 px-3 rounded bg-dark bg-opacity-25 border-start border-end border-info border-3">
            <div className="d-flex align-items-center justify-content-between">
                
                {/* Left Side: Goal Info */}
                <div className="flex-grow-1">
                    <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.05rem', lineHeight: '1' }}>
                        Next Milestone: <span className="text-light">{nextCutoff.name}</span>
                    </div>
                    <div className="mt-1 d-flex align-items-baseline">
                        <span className="fs-5 fw-bold text-info lh-1">{estimate}</span>
                        <span className="ms-1 text-light small text-nowrap">more clears</span>
                    </div>
                </div>

                {/* Right Side: Points needed */}
                {/* text-end keeps it right-aligned, while the parent flex handles the vertical centering */}
                <div className="text-end ps-2 border-start border-secondary border-opacity-25">
                    <div className="text-info fw-bold small" style={{ lineHeight: '1.2' }}>
                        +{pointsNeeded.toLocaleString()}
                    </div>
                    <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.6rem', whiteSpace: 'nowrap' }}>
                        Rating Pts
                    </div>
                </div>

            </div>
        </div>
    );
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

    // thanks 1948
    if (level === "29") { level = "??"}
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
                <div className={"col-8 text-start"}>
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
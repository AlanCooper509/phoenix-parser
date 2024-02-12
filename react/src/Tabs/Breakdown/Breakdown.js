import React, { useEffect, useRef, useState } from "react";

import BreakdownCategory from "./BreakdownCategory.js";
import getChartStats from '../../API/chartstats.js';
import BreakdownStats from "./BreakdownStats.js";

function updateCategoryHelper(event) {
    console.log(event);
    console.log("Not Yet Implemented");
}

function updateLevelHelper(event) {
    let level = event.target.value;
    level = level < 1 ? 1 : (level > 28 ? 28 : level);
    return parseInt(level);
}

function Breakdown({info, data}) {
    const [chartData, setChartData] = useState({});
    const [showLevel, setShowLevel] = useState(true);
    const [levelValue, setLevelValue] = useState(1);
    useEffect(() => getChartStats(setChartData), []);
    const levelSelect = useRef(null);
    const levelInput = useRef(null);

    function updateCategory(event) {
        setShowLevel(event.target.value == "level");
        updateCategoryHelper(event);
    }

    function updateLevel(event) {
        let level = updateLevelHelper(event);
        levelInput.current.value = level;
        setLevelValue(level);
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updateLevel(event);
        }
    }

    return (
        <>
        <div className="d-flex align-items-stretch align-middle justify-content-between mt-3 mb-4">
            <div className="px-2">
                <BreakdownCategory
                    innerRef={levelSelect}
                    updateCategory={updateCategory}
                />
            </div>
            <div className="px-2">
                <div className={showLevel ? "visible" : "invisible"}>
                    <label className="me-2" htmlFor="min">Level:</label>
                    <input ref={levelInput} className="Min-input" name="min" type="number" defaultValue="1" min="1" max="28" previous="1" onKeyDown={handleKeyDown} onClick={updateLevel} onBlur={updateLevel}></input>
                </div>
            </div>
        </div>
        <div className="container d-flex justify-content-center">
            <BreakdownStats
                userInfo={info}
                userData={data}
                chartData={chartData}
                levelSelect={levelSelect}
                level={levelValue}
            />
        </div>
        </>
    );
}

export default Breakdown;
import React, { useEffect, useRef, useState } from "react";

import BreakdownCategory from "./BreakdownCategory.js";
import getChartStats from '../../API/chartstats.js';
import BreakdownStats from "./BreakdownStats.js";
import ChartTypeSelect from "../../Helpers/ChartTypeSelect.js";

function updateLevelHelper(event) {
    let level = event.target.value;
    level = level < 1 ? 1 : (level > 28 ? 28 : level);
    return parseInt(level);
}

function Breakdown({info, data}) {
    const [chartData, setChartData] = useState({});
    const [showLevel, setShowLevel] = useState(true);
    const [chartType, setChartType] = useState("bothtypes");
    const [category, setCategory] = useState("level");
    const [levelValue, setLevelValue] = useState(1);
    useEffect(() => getChartStats(setChartData), []);
    const categorySelect = useRef(null);
    const chartTypeSelect = useRef(null);
    const levelInput = useRef(null);

    function updateCategory(event) {
        setShowLevel(event.target.value === "level");
        setCategory(event.target.value);
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

    const handleTypeChange = (event) => {
        setChartType(event.target.value);
    }

    return (
        <>
        <div className="d-flex align-items-stretch align-middle justify-content-between mt-3 mb-4">
            <div className="px-2">
                <BreakdownCategory
                    innerRef={categorySelect}
                    onInput={updateCategory}
                />
            </div>
            <div className={showLevel ? "visible" : "invisible"}>
                <ChartTypeSelect
                    innerRef={chartTypeSelect}
                    onInput={handleTypeChange}
                />
            </div>
            <div className="px-2">
                <div className={showLevel ? "visible" : "invisible"}>
                    <label className="me-2" htmlFor="min">Level:</label>
                    <input ref={levelInput} className="Min-input" name="min" type="number" defaultValue="1" min="1" max="28" previous="1" onKeyDown={handleKeyDown} onClick={updateLevel} onBlur={updateLevel}></input>
                </div>
            </div>
        </div>
        <div className="container">
            <BreakdownStats
                userInfo={info}
                userData={data}
                chartData={chartData}
                category={category}
                chartType={chartType}
                level={levelValue}
            />
        </div>
        </>
    );
}

export default Breakdown;
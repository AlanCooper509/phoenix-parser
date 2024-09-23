import React, { useEffect, useRef, useState } from "react";

import BreakdownCategory from "./BreakdownCategory.js";
import getChartStats from '../../API/chartstats.js';
import BreakdownStats from "./BreakdownStats.js";
import ChartTypeSelect from "../../Helpers/ChartTypeSelect.js";
import BarChart from "./BarChart.js";
import BreakdownRemaining from "./BreakdownRemaining.js";
import constants  from '../../Helpers/constants.json'

function updateLevelHelper(event) {
    let level = event.target.value;
    level = level < 1 ? 1 : (level > 28 ? 28 : level);
    return parseInt(level);
}

function getHighestClearLevel(data) {
    if (!data) {
        return 1;
    }

    for (const level of constants.levelsDescending) {
        if (level in data) {
            return parseInt(level);
        }
    }
    return 1;
}

function Breakdown({info, data}) {
    const [chartData, setChartData] = useState({});
    const [showLevel, setShowLevel] = useState(true);
    const [chartType, setChartType] = useState("bothtypes");
    const [category, setCategory] = useState("level");
    const [levelValue, setLevelValue] = useState(getHighestClearLevel(data));
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

    function getBarChartData() {
        if (!data) return {};
        switch (category) {
            case "level": {
                const level = levelValue < 10 ? `0${levelValue}` : levelValue.toString();
                if (!(level in data)) return {};
                switch (chartType) {
                    case "bothtypes":
                        return data[level];
                    case "singles":
                        const singlesOnly = data[level].scores.filter((value) => value.type === 's');
                        return {"scores": singlesOnly};
                    case "doubles":
                        const doublesOnly = data[level].scores.filter((value) => value.type === 'd');
                        return {"scores": doublesOnly};
                    default: return {};
                }
            }
            case "coop": {
                let barData = {"scores": []};
                if ("n2" in data) {
                    barData.scores.push(...data.n2.scores);
                }
                if ("n3" in data) {
                    barData.scores.push(...data.n3.scores);
                }
                if ("n4" in data) {
                    barData.scores.push(...data.n4.scores);
                }
                if ("n5" in data) {
                    barData.scores.push(...data.n5.scores);
                }
                return barData;
            }
            case "ucs": {
                let barData = {"scores": []};
                if (data["xx"]) {
                    barData = data["xx"];
                }
                return barData;
            }
            default: return {};
        }
    }

    function getTitle() {
        switch (category) {
            case "level":
                switch (chartType) {
                    case "bothtypes":
                        return `${info.player}: Level ${levelValue < 10? `0${levelValue}` : levelValue.toString()} Best Scores`;
                    case "singles":
                        return `${info.player}: S${levelValue < 10? `0${levelValue}` : levelValue.toString()} Best Scores`;
                    case "doubles":
                        return `${info.player}: D${levelValue < 10? `0${levelValue}` : levelValue.toString()} Best Scores`;
                    default:
                        return `Best Scores`;
                    }
            case "coop":
                return `${info.player}: Co-Op Best Scores`;
            case "ucs":
                return `${info.player}: UCS Best Scores`;
            default:
                return `Best Scores`;
        }
    }

    const barTitle = getTitle();
    const barSubtitle = `Letter Grade Distribution`;
    const barChartData = getBarChartData();

    return (
        <>
        <div className="d-flex mt-4 align-items-stretch align-middle justify-content-between mt-3 mb-4">
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
                    <input ref={levelInput} className="Min-input" name="min" type="number" defaultValue={levelValue} min="1" max="28" previous="1" onKeyDown={handleKeyDown} onClick={updateLevel} onBlur={updateLevel}></input>
                </div>
            </div>
        </div>
        <hr className="mb-4"/>
        <div className="container" style={{maxWidth: "800px"}}>
            <BarChart
                title={barTitle}
                subtitle={barSubtitle}
                chartData={barChartData}
                chartType={chartType}
            />
            &nbsp;
        </div>
        <div className="container mt-4">
            <BreakdownRemaining
                userData={data}
                chartData={chartData}
                category={category}
                levelValue={levelValue}
                chartType={chartType}
                language={info.language ? info.language : "ENGLISH"}
            />
        </div>
        <hr className="my-4"/>
        <div>
            <BreakdownStats
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
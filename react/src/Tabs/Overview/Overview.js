import React, { useRef } from "react";

import ScoresTable from '../../TableHelpers/ScoresTable.js';
import "./Overview.css";

import OverviewGraphHelper from "../../GraphHelpers/OverviewGraphHelper.js";
import GraphButtons from "../../GraphHelpers/GraphButtons.js";
import LineChart from "./LineChart.js";

const levelsDescending = ["28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "09", "08", "07", "06", "05", "04", "03", "02", "01"];

function Overview({info, data}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const chartRef = useRef(null);

    // for Overview Graph
    function updateGraphWrapper(changedInput) {
        const helper = new OverviewGraphHelper();
        const labels = helper.makeLevelLabelsFromInputs(chartTypeValue, minValue, maxValue, changedInput);
        return helper.updateGraph(chartRef, labels, data, info, chartTypeValue, changedInput);
    }

    let graphSetupObject = updateGraphWrapper();

    // for Best Scores Table
    let rowData = [];
    for (const key of levelsDescending) {
        if (data[key]) {
            rowData.push(...data[key].scores);
        }
    }

    return (
        <div className="row align-items-center justify-content-center">
            <div className="col-4">
            </div>
            <div className="Overview-chart col-8 mb-4">
                <LineChart 
                    innerRef={chartRef}
                    chartData={graphSetupObject["chartData"]}
                    title={graphSetupObject["title"]}
                    subtitle={graphSetupObject["subtitle"]}
                />
                <GraphButtons 
                    minValue={minValue}
                    maxValue={maxValue}
                    chartTypeValue={chartTypeValue}
                    updateLineGraph={updateGraphWrapper}
                />
            </div>
            <hr className="my-4"/>
            <div style={{width: "80%", minWidth: "800px"}}>
                <h3 className="mb-3">All Best Scores ({rowData.length})</h3>
                <ScoresTable
                    maxLevel={maxValue.current}
                    minLevel={minValue.current}
                    rowData={rowData}
                />
            </div>
        </div>
    );
}

export default Overview;
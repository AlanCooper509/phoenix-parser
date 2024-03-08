import React, { useRef, useState } from "react";

import ScoresTable from '../../TableHelpers/ScoresTable.js';
import "./Overview.css";

import OverviewGraphHelper from "../../GraphHelpers/OverviewGraphHelper.js";
import GraphButtons from "../../GraphHelpers/GraphButtons.js";
import LineChart from "./LineChart.js";
import ChartTypeSelect from "../../Helpers/ChartTypeSelect.js";

function getTableData(data, tableTypeValue) {
    const levelsDescending = ["28", "27", "26", "25", "24", "23", "22", "21", "20", "19", "18", "17", "16", "15", "14", "13", "12", "11", "10", "09", "08", "07", "06", "05", "04", "03", "02", "01"];
    const coopCategories = ["n2", "n3", "n4", "n5"];
    const ucsCategory = ["xx"];
    let rowData = [];

    if (tableTypeValue === "bothtypes" || tableTypeValue === "singles" || tableTypeValue === "doubles") {
        for (const key of levelsDescending) {
            if (data[key]) {
                rowData.push(...data[key].scores);
            }
        }
    }
    if (tableTypeValue === "coop") {
        for (const key of coopCategories) {
            if (data[key]) {
                rowData.push(...data[key].scores);
            }
        }
    }
    if (tableTypeValue === "ucs") {
        const key = ucsCategory;
        if (data[key]) {
            rowData.push(...data[key].scores);
        }
    }
    let filteredData = rowData.filter((entry) => { 
        if (tableTypeValue === "bothtypes") {
            return true;
        }
        if (tableTypeValue === "singles" && entry.type === "s") {
            return true;
        }
        if (tableTypeValue === "doubles" && entry.type === "d") {
            return true;
        }
        if (tableTypeValue === "coop" && entry.type === "c") {
            return true;
        }
        if (tableTypeValue === "ucs" && entry.type === "u") {
            return true;
        }
        return false;
    });
    rowData = filteredData;
    return rowData;
}

function Overview({info, data}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const chartRef = useRef(null);
    const tableTypeSelect = useRef(null);
    const [tableTypeValue, setTableTypeValue] = useState("bothtypes");

    // for Overview Graph
    function updateGraphWrapper(changedInput) {
        const helper = new OverviewGraphHelper();
        const labels = helper.makeLevelLabelsFromInputs(chartTypeValue, minValue, maxValue, changedInput);
        return helper.updateGraph(chartRef, labels, data, info, chartTypeValue, changedInput);
    }

    let graphSetupObject = updateGraphWrapper();

    // for Best Scores Table
    let rowData = getTableData(data, tableTypeValue);


    function updateRowData(event) {
        setTableTypeValue(event.target.value);
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
                <div className="d-flex justify-content-between align-items-center">
                    <h3 className="mb-3">Best Scores ({rowData.length})</h3>
                    <ChartTypeSelect
                        innerRef={tableTypeSelect}
                        onInput={updateRowData}
                        coopOption={true}
                        ucsOption={true}
                    />
                </div>
                <ScoresTable
                    rowData={rowData}
                    sortLevel={true}
                />
            </div>
        </div>
    );
}

export default Overview;
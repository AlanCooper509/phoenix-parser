import React, { useRef } from "react";

import "./Overview.css";

import OverviewGraphHelper from "../../GraphHelpers/OverviewGraphHelper.js";
import GraphButtons from "../../GraphHelpers/GraphButtons.js";
import LineChart from "./LineChart.js";

function Overview({info, data, titles}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const chartRef = useRef(null);

    function updateGraphWrapper(changedInput) {
        const helper = new OverviewGraphHelper();
        const labels = helper.makeLevelLabelsFromInputs(chartTypeValue, minValue, maxValue, changedInput);
        return helper.updateGraph(chartRef, labels, data, info, chartTypeValue, changedInput);
    }

    let graphSetupObject = updateGraphWrapper();

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
        </div>
    );
}

export default Overview;
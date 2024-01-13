import React, { useRef } from "react";

import "./Overview.css";

import GraphHelpers from "../GraphHelpers/GraphHelpers.js";
import LineChart from "./LineChart.js";

class OverviewGraphHelpers extends GraphHelpers {
    getGraphSetupObject(labels, averages, percentages, title, subtitle) {
        return {
            "subtitle": subtitle,
            "title": title,
            "chartData": {
                labels: labels,
                datasets: [{
                    type: "line",
                    label:  "AVG SCORE",
                    data: averages,
                    borderWidth: 1,
                    yAxisID: "y"
                }, {
                    type: "bar",
                    label: "% CLEARED",
                    data: percentages,
                    yAxisID: "y1"
                }]
            }
        }
    }
    updateGraphData(chartRef, labels, lineData, barData, title, subtitle) {
        chartRef.current.data.labels = labels;
        chartRef.current.data.datasets[0].data = lineData;
        chartRef.current.data.datasets[1].data = barData;
        chartRef.current.options.plugins.title.text = title;
        chartRef.current.options.plugins.subtitle.text = subtitle;
        chartRef.current.update();
    }
}

function Overview({info, data}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const chartRef = useRef(null);
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updateLineGraph(event);
        }
    }
    function updateLineGraph(changedInput) {
        const helpers = new OverviewGraphHelpers();
        const inputs = helpers.validateFormInputs(chartTypeValue, minValue, maxValue, changedInput);
        const labels = helpers.makeLevelLabels(inputs);
        const averages = helpers.getAveragesForKeys(data, labels, chartTypeValue);
        const percentages = helpers.getClearPercentForKeys(data, labels, chartTypeValue);
        const subtitle = helpers.getSubtitle(info["last_updated"]);
        const title = helpers.getTitle(info["player"], chartTypeValue);

        if (changedInput) {
            helpers.updateGraphData(chartRef, labels, averages, percentages, title, subtitle);
        } else {
            const graphSetup = helpers.getGraphSetupObject(labels, averages, percentages, title, subtitle);
            return graphSetup;
        }
    }
    let graphSetupObject = updateLineGraph();
    const subtitle = graphSetupObject["subtitle"];
    const title = graphSetupObject["title"];
    const chartData = graphSetupObject["chartData"];

    return (
        <div className="row align-items-center justify-content-center">
            <div className="col-4">
            </div>
            <div className="Overview-chart col-8 mb-4">
                <LineChart 
                    innerRef={chartRef}
                    chartData={chartData}
                    title={title}
                    subtitle={subtitle}
                />
                <div className="d-flex pt-4 align-items-center justify-content-center">
                    <div className="px-2 text-center">
                        <label className="me-2" htmlFor="min">Min Level:</label>
                        <input ref={minValue} className="Min-input" id="min" type="number" defaultValue="1" min="1" max="28" previous="1" onKeyDown={handleKeyDown} onClick={updateLineGraph} onBlur={updateLineGraph}></input>
                    </div>
                    <div className="px-2 text-center">
                        <label className="me-2" htmlFor="max">Max Level:</label>
                        <input ref={maxValue} className="Max-input" id="max" type="number" defaultValue="28" min="1" max="28" previous="28" onKeyDown={handleKeyDown} onClick={updateLineGraph} onBlur={updateLineGraph}></input>
                    </div>
                    <div className="px-4 text-center">
                        <label className="me-2" htmlFor="chartType">Select Chart Type:</label>
                        <select ref={chartTypeValue} name="chartType" id="chartType" defaultValue="bothtypes" onInput={updateLineGraph}>
                            <option value="bothtypes">Singles and Doubles</option>
                            <option value="singles">Singles</option>
                            <option value="doubles">Doubles</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Overview;
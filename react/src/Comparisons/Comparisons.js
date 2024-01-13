import React, { useRef } from "react";

import "./Comparisons.css";

import GraphHelpers from "../GraphHelpers/GraphHelpers.js";
import LineChart from "./LineChart.js";

class ComparisonsGraphHelpers extends GraphHelpers {
    getGraphSetupObject(labels, multipleUsersData, title, subtitle) {
        let datasets = [];
        for (const idx in multipleUsersData) {
            let dataset = {
                type: "line",
                label: `P${parseInt(idx)+1} Averages`,
                data: multipleUsersData[idx],
                borderWidth: 1,
                yAxisID: "y"
            }
            datasets.push(dataset);
        }
        return {
            title: title,
            subtitle: subtitle,
            chartData: {
                labels: labels,
                datasets: datasets
            }
        }
    }
    updateGraphData(chartRef, labels, multipleUsersData, title, subtitle) {
        chartRef.current.data.labels = labels;
        for (const idx in multipleUsersData) {
            chartRef.current.data.datasets[idx].data = multipleUsersData[idx];            
        }
        chartRef.current.options.plugins.title.text = title;
        chartRef.current.options.plugins.subtitle.text = subtitle;
        chartRef.current.update();
    }
}

function Comparisons({info, data}) {
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
        const helpers = new ComparisonsGraphHelpers();
        const inputs = helpers.validateFormInputs(chartTypeValue, minValue, maxValue, changedInput);
        const labels = helpers.makeLevelLabels(inputs);
        const p1 = helpers.getAveragesForKeys(data, labels, chartTypeValue);
        const p2 = helpers.getAveragesForKeys(data, labels, chartTypeValue);
        const subtitle = helpers.getSubtitle(info["last_updated"]);
        const title = helpers.getTitle(info["player"], chartTypeValue);

        if (changedInput) {
            helpers.updateGraphData(chartRef, labels, [p1, p2], title, subtitle);
        } else {
            const graphSetup = helpers.getGraphSetupObject(labels, [p1, p2], title, subtitle);
            return graphSetup;
        }
    }
    let graphSetupObject = updateLineGraph();
    const subtitle = graphSetupObject["subtitle"];
    const title = graphSetupObject["title"];
    const chartData = graphSetupObject["chartData"];

    return (
        <div className="row align-items-top justify-content-center">
            <div className="col-4">
                <div className="d-flex align-items-center justify-content-center">
                    <div className="d-flex flex-column align-items-start mt-2">
                        <label htmlFor="addPlayer">Add Player</label>
                        <div className="d-flex align-items-center justify-content-center mt-2 mb-5">
                            <input className="mx-2" placeholder="NAME #1234"></input>
                            <span className="border-dark btn btn-sm btn-secondary">Add</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="Comparisons-chart col-8 mb-4">
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

export default Comparisons;
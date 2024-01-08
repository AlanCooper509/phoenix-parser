import React, { useRef } from "react";
import './Overview.css'
import LineChart from "./LineChart.js"


function Overview({info, data}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const chartRef = useRef(null);
    const _info = info;
    const _data = data;

    function validateAllInputs(changedInput) {
        let chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let min = parseInt(minValue.current == null ? "1" : minValue.current.value);
        let max = parseInt(maxValue.current == null ? "28" : maxValue.current.value);
        let value = -1, cutoff = -1;
        switch (changedInput) {
            case "min":
                value = min;
                cutoff = max;
                minValue.current.value = value < 1 ? 1 : value > 28 ? 28 : value > cutoff ? cutoff : value;
                break;
            case "max":
                value = max;
                cutoff = min;
                maxValue.current.value = value < 1 ? 1 : value > 28 ? 28 : value < cutoff ? cutoff : value;
                break;
            default:
                break;
        }
        const userSettings = {"min": min, "max": max, "chartType": chartType};
        return userSettings;
    }
    function makeLevelLabels(inputs) {
        let labels = [];
        for (let i = inputs["min"]; i <= inputs["max"]; i++) {
            let label = i < 10 ? `0${i}` : i.toString();
            labels.push(label);
        }
        return labels;
    }
    function getAveragesForKeys(data, labels) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let averages = [];
        for (const idx in labels) {
            switch (chartType) {
                case ("bothtypes"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["average"] : NaN);
                    break;
                case ("singles"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["singles"]["average"] : NaN);
                    break;
                case ("doubles"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["doubles"]["average"] : NaN);
                    break;
            }
        }
        return averages;
    }
    function getClearPercentForKeys(data, labels) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let percentages = [];
        for (const idx in labels) {
            switch (chartType) {
                case ("bothtypes"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["clear"] : 0.00);
                    break;
                case ("singles"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["singles"]["clear"] : 0.00);
                    break;
                case ("doubles"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["doubles"]["clear"] : 0.00);
                    break;
            }
        }
        return percentages;
    }
    function getSubtitle(lastSyncedDate) {
        const rightPadding = " ".repeat(24);
        const subtitle = `Last Synced: ${lastSyncedDate}${rightPadding}`;
        return subtitle;
    }
    function getTitle(name, chartType) {
        if (chartType == null) { chartType = "bothtypes" };
        let typeText = '';
        switch (chartType) {
            case "bothtypes":
                typeText = "Singles and Doubles";
                break;
            case "singles":
                typeText = "Singles";
                break;
            case "doubles":
                typeText = "Doubles";
                break;
            case "coop":
                typeText = "Co-Op";
                break;
        }
        const title = `${name} (${typeText})`;
        return title;
    }
    function initGraphData(data) {
        const inputs = validateAllInputs();
        const labels = makeLevelLabels(inputs);
        const averages = getAveragesForKeys(data, labels);
        const percentages = getClearPercentForKeys(data, labels);
        return {
            labels: labels,
            datasets: [
                {
                    type: "line",
                    label:  "AVG SCORE",
                    data: averages,
                    borderWidth: 1,
                    yAxisID: "y"
                },
                {
                    type: "bar",
                    label: "% CLEARED",
                    data: percentages,
                    yAxisID: "y1"
                }
            ]
        };
    }
    function updateLineGraph(changedInput) {
        function updateGraphData(labels, lineData, barData, title, subtitle) {
            chartRef.current.data.labels = labels;
            chartRef.current.data.datasets[0].data = lineData;
            chartRef.current.data.datasets[1].data = barData;
            chartRef.current.options.plugins.title.text = title;
            chartRef.current.options.plugins.subtitle.text = subtitle;
            chartRef.current.update();
        }
        const inputs = validateAllInputs(changedInput);
        const labels = makeLevelLabels(inputs);
        const averages = getAveragesForKeys(_data, labels);
        const percentages = getClearPercentForKeys(_data, labels);
        const subtitle = getSubtitle(info["last_updated"]);
        const title = getTitle(info["player"]);
        updateGraphData(labels, averages, percentages, title, subtitle);
    }
    let chartData = initGraphData(data);
    const subtitle = getSubtitle(info["last_updated"]);
    const title = getTitle(info["player"]);

    return (
        <div className="container">
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
                        <div className="px-1 text-center">
                            <label htmlFor="min">Min Level:</label><br/>
                            <input ref={minValue} className="Min-input" id="min" type="number" defaultValue="1" min="1" max="28" onInput={updateLineGraph}></input>
                        </div>
                        <div className="px-1 text-center">
                            <label htmlFor="max">Max Level:</label><br/>
                            <input ref={maxValue} className="Max-input" id="max" type="number" defaultValue="28" min="1" max="28" onInput={updateLineGraph}></input>
                        </div>
                        <div className="px-4 text-center">
                            <label htmlFor="chartType">Select Chart Type:</label><br/>
                            <select ref={chartTypeValue} name="chartType" id="chartType" defaultValue="bothtypes" onInput={updateLineGraph}>
                                <option value="bothtypes">Singles and Doubles</option>
                                <option value="singles">Singles</option>
                                <option value="doubles">Doubles</option>
                                <option value="coop">Co-Op</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Overview;
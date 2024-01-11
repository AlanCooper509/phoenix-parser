import React, { useRef } from "react";
import './Overview.css'
import LineChart from "./LineChart.js"

class OverviewGraphHelpers {
    validateFormInputs(chartTypeValue, minValue, maxValue, changedInput) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let min = minValue.current ? parseInt(minValue.current.value) : 1;
        let minPrev = minValue.current ? minValue.current.getAttribute("previous") : 1;
        let max = maxValue.current ? parseInt(maxValue.current.value) : 28;
        let maxPrev = maxValue.current ? maxValue.current.getAttribute("previous") : 28;
    
        if (changedInput) {
            switch (changedInput.target.id) {
                case "min":
                    if (isNaN(min)) {
                        min = minPrev;
                    } else {
                        min = min < 1 ? 1 : (min > 28 ? 28 : min > max ? max : min);
                        minValue.current.value = min;
                        minValue.current.setAttribute("previous", min);
                    }
                    break;
                case "max":
                    if (isNaN(max)) {
                        max = maxPrev;
                        break;
                    }
                    max = max < 1 ? 1 : max > 28 ? 28 : max < min ? min : max;
                    maxValue.current.value = max;
                    maxValue.current.setAttribute("previous", max);
                    break;
                default:
                    break;
            }
        }
    
        const userSettings = {"min": min, "max": max, "chartType": chartType};
        return userSettings;
    }
    makeLevelLabels(inputs) {
        let labels = [];
        for (let i = inputs["min"]; i <= inputs["max"]; i++) {
            let label = i < 10 ? `0${i}` : i.toString();
            labels.push(label);
        }
        return labels;
    }
    getAveragesForKeys(data, labels, chartTypeValue) {
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
    getClearPercentForKeys(data, labels, chartTypeValue) {
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
    getSubtitle(lastSynced) {
        const rightPadding = " ".repeat(24);
        const subtitle = `Last Synced: ${lastSynced}${rightPadding}`;
        return subtitle;
    }
    getTitle(player, chartTypeValue) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
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
        const title = `${player} (${typeText})`;
        return title;
    }
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
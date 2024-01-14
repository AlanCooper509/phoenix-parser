import React, { useRef, useState } from "react";

import "./Comparisons.css";

import ComparisonsGraphHelper from "../GraphHelpers/ComparisonsGraphHelper.js";
import GraphButtons from "../GraphHelpers/GraphButtons.js";
import Sidebar from "./Sidebar.js";
import LineChart from "./LineChart.js";

function formatName(value) {
    return value.toUpperCase().replaceAll(/\s/g, '').replaceAll(/\#/g, " #");
}

function Comparisons({info, data}) {
    const minValue = useRef(null);
    const maxValue = useRef(null);
    const chartTypeValue = useRef(null);
    const graphType = useRef(null);
    const chartRef = useRef(null);

    const [dataP2, setDataP2] = useState([]);
    const p2NameInput = useRef(null);

    const [dataP3, setDataP3] = useState([]);
    const p3NameInput = useRef(null);

    const [dataP4, setDataP4] = useState([]);
    const p4NameInput = useRef(null);
    
    function updateGraphWrapper(changedInput) {
        const helper = new ComparisonsGraphHelper();
        const labels = helper.makeLevelLabelsFromInputs(chartTypeValue, minValue, maxValue, changedInput);
        const datasets = [
            {data: data, label: `${info.player} ${info.number}`}
        ];
        if (dataP2.length !== 0) {
            datasets.push(
                {data: dataP2, label: formatName(p2NameInput.current.value)}
            );
        }
        if (dataP3.length !== 0) {
            datasets.push(
                {data: dataP3, label: formatName(p3NameInput.current.value)}
            );
        }
        if (dataP4.length !== 0) {
            datasets.push(
                {data: dataP4, label: formatName(p4NameInput.current.value)}
            );
        }
        return helper.updateGraph(chartRef, labels, datasets, chartTypeValue, graphType, changedInput);
    }
    const graphSetupObject = updateGraphWrapper();

    // rendering
    return (
        <div className="row align-items-top justify-content-center">
            <div className="col-4">
                <Sidebar
                    graphType={graphType}
                    handleGraphToggle={updateGraphWrapper}
                    infoP1={info}
                    p2={{ref: p2NameInput, setData: setDataP2}}
                    p3={{ref: p3NameInput, setData: setDataP3}}
                    p4={{ref: p4NameInput, setData: setDataP4}}
                />
            </div>
            <div className="Comparisons-chart col-8 mb-4">
                <LineChart 
                    innerRef={chartRef}
                    graphType={graphType}
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

export default Comparisons;
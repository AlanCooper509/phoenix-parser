import ScoresTable from '../../TableHelpers/ScoresTable.js';

function addChartsForLevel(userData, level, chartType) {
    let rowData = [];
    let filteredData = [];
    let subset = userData[level];
    if (subset) {
        rowData = subset.scores;
        filteredData = rowData.filter((entry) => { 
            if (chartType === "bothtypes") {
                return true;
            }
            if (chartType === "singles" && entry.type === "s") {
                return true;
            }
            if (chartType === "doubles" && entry.type === "d") {
                return true;
            }
            return false;
        });
    }
    return filteredData;
}

function addCoopCharts(userData) {
    const rowData = [
        ...(userData["n2"] ? userData["n2"].scores : []),
        ...(userData["n3"] ? userData["n3"].scores : []),
        ...(userData["n4"] ? userData["n4"].scores : []),
        ...(userData["n5"] ? userData["n5"].scores : []),
    ];
    return rowData;
}

function getCoopChartCount(chartData) {
    let coopCounts = chartData["coop"];
    return coopCounts["n2"] + coopCounts["n3"] + coopCounts["n4"] + coopCounts["n5"];
}

function addUcsCharts(userData) {
    let rowData = [];
    const key = "xx";
    if (userData[key]) {
        rowData.push(...userData[key].scores);
    }
    return rowData;
}

function getChartCountForLevel(chartData, level, chartType) {
    let chartCount;
    if (chartData && chartData[level]) {
        if (chartType === "bothtypes") {
            chartCount = chartData[level].total;
        }
        if (chartType === "singles") {
            chartCount = chartData[level].singles;
        }
        if (chartType === "doubles") {
            chartCount = chartData[level].doubles;
        }
    }
    return chartCount;
}

function BreakdownStats({ userData, chartData, category, chartType, level }) {
    let rowData = [];
    let chartCount;
    level = level < 10 ? '0' + level : String(level);

    if (category === "level") {
        rowData = addChartsForLevel(userData, level, chartType);
        chartCount = getChartCountForLevel(chartData, level, chartType);
    }
    if (category === "coop") {
        rowData = addCoopCharts(userData);
        chartCount = getCoopChartCount(chartData);
    }
    if (category === "ucs") {
        rowData = addUcsCharts(userData);
    }
    return (
        <div>
            <div className="d-flex flex-column align-items-center justify-content-center">
                <div style={{width: "80%", minWidth: "800px"}}>
                    <h4>Best Scores 
                        ({rowData.length}{chartCount ? `/${chartCount}` : ``})
                    </h4>
                    <ScoresTable
                        rowData={rowData}
                        sortLevel={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default BreakdownStats;
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
        });
    }
    return filteredData;
}

function addCoopCharts(userData) {
    let rowData = [];
    const categories = ["n2", "n3", "n4", "n5"];
    for (const key of categories) {
        if (userData[key]) {
            rowData.push(...userData[key].scores);
        }
    }
    return rowData;
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

function BreakdownStats({ userInfo, userData, chartData, category, chartType, level }) {
    let rowData = [];
    let chartCount;
    level = level < 10 ? '0' + level : String(level);

    if (category === "level") {
        rowData = addChartsForLevel(userData, level, chartType);
        chartCount = getChartCountForLevel(chartData, level, chartType);
    }
    if (category === "coop") {
        rowData = addCoopCharts(userData);
    }
    if (category === "ucs") {
        rowData = addUcsCharts(userData);
    }
    return (
        <div>
            <hr className="my-4"/>
            <div className="d-flex flex-column align-items-center justify-content-center">
                <div style={{width: "80%", minWidth: "800px"}}>
                    <h4>Best Scores 
                        ({rowData.length}{chartCount ? `/${chartCount}` : ``})
                    </h4>
                    <ScoresTable
                        rowData={rowData}
                    />
                </div>
            </div>
        </div>
    );
}

export default BreakdownStats;
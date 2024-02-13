import ScoresTable from '../../TableHelpers/ScoresTable.js';

function BreakdownStats({ userInfo, userData, chartData, levelSelect, level }) {
    let rowData = [];
    let chartCount = '';
    level = level < 10 ? '0' + level : String(level);

    if (levelSelect.current && levelSelect.current.value === "level") {
        let subset = userData[level];
        console.log(userData);
        if (subset) {
            rowData = subset.scores;
        }
        console.log(chartData);
        if (chartData && chartData[level]) {
            chartCount = chartData[level].total;
        }
    }
    return (
        <div>
            <hr className="my-4"/>
            <div className="d-flex flex-column align-items-center justify-content-center">
                <div style={{width: "80%", minWidth: "800px"}}>
                    <h4>Best Scores ({rowData.length}/{chartCount})</h4>
                    <ScoresTable
                        rowData={rowData}
                    />
                </div>
            </div>
        </div>
    );
}

export default BreakdownStats;
import { useState } from "react";
import BreakdownModal from './BreakdownModal';
import getChartsForLevel from "../../API/chartlevel";

function setTitle(userData, chartData, category, levelValue, chartType) {
    let count = 0;
    let max = 0;
    let title = '';
    levelValue = levelValue ? (levelValue < 10 ? "0" + levelValue : levelValue.toString()) : null;
    switch (category) {
        case "ucs": break;
        case "coop":
            max = 0;
            const coopKeys = ['n2', 'n3', 'n4', 'n5'];
            for (const coopKey of coopKeys) {
                count += userData[coopKey] ? userData[coopKey].count : 0;
                max += chartData["coop"] ? chartData["coop"][coopKey] : 0;
            }
            title = `Co-Op Remaining (${max-count}/${max})`;
            break;
        case "level":
            switch (chartType) {
                case "bothtypes": 
                    count = userData[levelValue] ? userData[levelValue].count : 0;
                    max = chartData[levelValue] ? chartData[levelValue].total : 0;
                    title = `Level ${levelValue} Remaining (${max-count}/${max})`
                    break;
                case "singles":
                    count = userData[levelValue] ? userData[levelValue].singles.count : 0;
                    max = chartData[levelValue] ? chartData[levelValue].singles : 0;
                    title = `Single ${levelValue} Remaining (${max-count}/${max})`
                    break;
                case "doubles":
                    count = userData[levelValue] ? userData[levelValue].doubles.count : 0;
                    max = chartData[levelValue] ? chartData[levelValue].doubles : 0;
                    title = `Double ${levelValue} Remaining (${max-count}/${max})`
                    break;
                default: break;
            }
            break;
        default: break;
    }
    return title;
}

function BreakdownRemaining({userData, chartData, category, levelValue, chartType}) {
    const [show, setShow] = useState(false);
    const [chartList, setChartList] = useState([]);
    const handleClose = () => setShow(false);

    const title = setTitle(userData, chartData, category, levelValue, chartType);

    function updateChartList(charts) {
        let referenceList = [];

        // combine object lists of charts into a single array
        for (const key in charts) {
            referenceList = [...referenceList, ...charts[key]];
        }

        switch (category) {
            case "ucs": break;
            case "coop":
                referenceList = referenceList.filter((chart) => chart.type === 'c');
                break;
            case "level":
                const cleared = userData[levelValue] ? userData[levelValue].scores : [];
                for (const score of cleared) {
                    // find cleared score in reference list
                    const idx = referenceList.findIndex((entry) =>
                        score.name === entry.name &&
                        score.type === entry.type &&
                        score.level === entry.level
                    );
                    // remove match at index from reference list
                    if (idx > -1) { referenceList.splice(idx, 1); }
                }
                switch (chartType) {
                    case "bothtypes":
                        referenceList = referenceList.filter((chart) => chart.type === 'd' || chart.type === 's');
                        break;
                    case "singles":
                        referenceList = referenceList.filter((chart) => chart.type === 's');
                        break;
                    case "doubles":
                        referenceList = referenceList.filter((chart) => chart.type === 'd');
                        break;
                    default: break;
                }
                break;
            default: break;
        }
        setChartList(referenceList);
    }

    function handleShow() {
        switch (category) {
            case "ucs": break;
            case "coop":
                getChartsForLevel(category, updateChartList);
                setShow(true);
                break;
            case "level":
                const level = levelValue < 10 ? `0${levelValue}` : levelValue.toString();
                getChartsForLevel(level, updateChartList);
                setShow(true);
                break;
            default: break;
        }
    }

    return (
        <>
        <div className="row justify-content-center">
            <div className="col" style={{maxWidth: "800px"}}>
                <div className="d-flex justify-content-end">
                    <div>
                        <button onClick={handleShow} className="btn btn-secondary">Show Uncleared</button>
                    </div>
                </div>
            </div>
        </div>
        <BreakdownModal
            show={show}
            handleClose={handleClose}
            title={title}
            remainingCharts={chartList}
        />
        </>
      );
}

export default BreakdownRemaining;
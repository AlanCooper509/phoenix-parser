import { useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "./ScoresTable.css";

function BreakdownStats({ rowData }) {
    // Displays {Co-Op, Single, Double} stepball image based on "type" value
    const chartTypeRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center justify-content-center">
            {value && 
                <img alt={`${value}`}
                    src={`https://www.piugame.com/l_img/stepball/full/${value}_bg.png`}
                    style={{width: "45px", height: "auto", maxHeight: "80%"}}
                />
            }
        </span>
    );

    // Displays grade image based on "grade" value
    const gradeTypeRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center justify-content-center">
            {value && 
                <img alt={`${value}`}
                    src={`https://www.piugame.com/l_img/grade/${value}.png`}
                    className="d-block"
                    style={{width: "40px", height: "auto", maxHeight: "50%"}}
                />
            }
        </span>
    );

    // Displays plate image based on "plate" value
    const plateTypeRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center ms-3">
            {value && 
                <img alt={`${value}`}
                    src={`https://www.piugame.com/l_img/plate/s_${value}.png`}
                    className="d-block"
                    style={{width: "40px", height: "auto", maxHeight: "50%"}}
                />
            }
        </span>
    );

    const levelRenderer = ({ value, data }) => (
        <span className="position-relative level-margins">
            {value && value != "xx" && 
            <>
            <span className="game-font level-font level-font-margin position-absolute">
                {data.level[0] === "1" ? <span className="onespaceleft"></span> : <></>}
                {data.level[0] === "n" ? "x" : data.level[0]}
                {data.level[0] === "1" ? <span className="onespaceright"></span> : <></>}
                {data.level[1] === "1" ? <span className="onespaceleft"></span> : <></>}
                {data.level[1]}
                {data.level[1] === "1" ? <span className="onespaceright"></span> : <></>}
            </span>
            <img alt={`${data.type}`}
                src={`https://www.piugame.com/l_img/stepball/full/${data.type}_bg.png`}
                style={{width: "45px", height: "auto", maxHeight: "80%"}}
            />
            </>
            }
            {value && value == "xx" &&
            <>
            <span className="game-font level-font level-font-margin position-absolute">
                !<span className="onespaceleft"></span><span className="onespaceright"></span>!
            </span>
            </>
            }
        </span>
    );
    
    const nameRenderer = ({ value }) => (
        <span className="name-font d-flex h-100 w-100 align-items-center mt-1">
            {value}
        </span>
    );

    const scoreRenderer = ({ value }) => (
        <b className="score-font d-flex h-100 w-100 align-items-center justify-content-start mt-1">
            {value}
        </b>
    );

    const scoreComparator = function(valueA, valueB, nodeA, nodeB, isDescending) {
        let scoreA = Number(valueA.replace(/,/g, ''));
        let scoreB = Number(valueB.replace(/,/g, ''));
        let levelA = Number(nodeA.data.level.replace(/,/g, ''));
        let levelB = Number(nodeB.data.level.replace(/,/g, ''));
        if (scoreA !== scoreB) {
            return (scoreA > scoreB) ? 1 : -1;
        }
        if (levelA !== levelB) {
            return (levelA > levelB) ? 1 : -1;
        }
        return 0;
    }

    const gradeComparator = function(valueA, valueB, nodeA, nodeB, isDescending) {
        // use score value directly rather than grade
        let scoreA = Number(nodeA.data.score.replace(/,/g, ''));
        let scoreB = Number(nodeB.data.score.replace(/,/g, ''));
        let levelA = Number(nodeA.data.level.replace(/,/g, ''));
        let levelB = Number(nodeB.data.level.replace(/,/g, ''));
        if (scoreA !== scoreB) {
            return (scoreA > scoreB) ? 1 : -1;
        }
        if (levelA !== levelB) {
            return (levelA > levelB) ? 1 : -1;
        }
        return 0;
    }

    const plateComparator = function(valueA, valueB, nodeA, nodeB, isDescending) {
        let order = ["rg", "fg", "tg", "mg", "sg", "eg", "ug", "pg"];
        let plateA = order.indexOf(valueA);
        let plateB = order.indexOf(valueB);
        let scoreA = Number(nodeA.data.score.replace(/,/g, ''));
        let scoreB = Number(nodeB.data.score.replace(/,/g, ''));
        let levelA = Number(nodeA.data.level.replace(/,/g, ''));
        let levelB = Number(nodeB.data.level.replace(/,/g, ''));
        if (plateA !== plateB) {
            return (plateA > plateB) ? 1 : -1;
        }
        if (scoreA !== scoreB) {
            return (scoreA > scoreB) ? 1 : -1;
        }
        if (levelA !== levelB) {
            return (scoreA > scoreB) ? 1 : -1;
        }
        return 0;
    }

    const scoreFilterParams = {
        allowedCharPattern: '\\d\\,',
        numberParser: text => {
            return text == null ? null : Number(text.replace(/,/g, ''));
        },
        numberFormatter: value => {
            return value == null ? null : value.toLocaleString();
        }
    }

    const gradeFilterParams = {
        filterOptions: ['equals', 'notEqual', 'startsWith'],
        defaultOption: 'equals'
    }

    const scoreFilterValueGetter = function(params) {
        return Number(params.data.score.replace(/,/g, ''));
    }

    const gradeFilterValueGetter = function(params) {
        return params.data.grade.replace(/_p/g, '+');
    }

    // Column Definitions: Defines & controls grid columns.
    const columnDefs = [
        { field: "type", minWidth: 80, maxWidth: 80, hide: true, cellRenderer: chartTypeRenderer },
        { field: "level", minWidth: 100, maxWidth: 100, cellRenderer: levelRenderer },
        { field: "score", minWidth: 120, maxWidth: 120, floatingFilter: true, filter: "agNumberColumnFilter", filterParams: scoreFilterParams, filterValueGetter: scoreFilterValueGetter, comparator: scoreComparator, cellRenderer: scoreRenderer },
        { field: "name", floatingFilter: true, filter: "agTextColumnFilter", cellRenderer: nameRenderer, flex: 1 },
        { field: "grade", minWidth: 120, maxWidth: 120, floatingFilter: true, filter: "agTextColumnFilter", filterParams: gradeFilterParams, filterValueGetter: gradeFilterValueGetter, comparator: gradeComparator, cellRenderer: gradeTypeRenderer },
        { field: "plate", minWidth: 120, maxWidth: 120, floatingFilter: true, filter: "agTextColumnFilter", comparator: plateComparator, cellRenderer: plateTypeRenderer }
    ];
  
    const onGridReady = useCallback((params) => {
        window.addEventListener('resize', () => {
            setTimeout(() => {
            params.api.sizeColumnsToFit();
            });
        });
        /*
        window.addEventListener('click', () => {
            setTimeout(() => {
            params.api.sizeColumnsToFit();
            });
        });
        */
    }, []);
  
    return (
      <div className="w-100">
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <div style={{ overflow: 'hidden', flexGrow: '1' }}>
            <div className={"ag-theme-quartz-dark"} style={{ width: "100%" }}>
              <AgGridReact
                rowData={rowData}
                rowHeight={50}
                columnDefs={columnDefs}
                domLayout="autoHeight"
                autoSizeStrategy={{type: "fitGridWidth"}}
                onGridReady={onGridReady}
                stateUpdated={onGridReady}
              />
            </div>
          </div>
        </div>
      </div>
    );
}

export default BreakdownStats;
import { useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

function BreakdownStats({ userInfo, userData, chartData, levelSelect, level }) {
    // Displays {Co-Op, Single, Double} stepball image based on "type" value
    const chartTypeRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center justify-content-end">
            <i className="pe-1 me-1">{level}</i>
            {value && 
                <img alt={`${value}`}
                    src={`https://www.piugame.com/l_img/stepball/full/${value}_bg.png`}
                    className="d-block"
                    style={{width: "30px", height: "auto", maxHeight: "60%"}}
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
        <span className="d-flex h-100 w-100 align-items-center">
            {value && 
                <img alt={`${value}`}
                    src={`https://www.piugame.com/l_img/plate/s_${value}.png`}
                    className="d-block"
                    style={{width: "40px", height: "auto", maxHeight: "50%"}}
                />
            }
        </span>
    );

    const nameRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center">
            {value}
        </span>
    );

    const scoreRenderer = ({ value }) => (
        <b className="d-flex h-100 w-100 align-items-center justify-content-center">
            {value}
        </b>
    );

    // Column Definitions: Defines & controls grid columns.
    const columnDefs = [
        { field: "type", minWidth: 80, maxWidth: 80, floatingFilter: true, filter: "agTextColumnFilter", cellRenderer: chartTypeRenderer },
        { field: "score", minWidth: 80, maxWidth: 80, cellRenderer: scoreRenderer },
        { field: "name", floatingFilter: true, filter: "agTextColumnFilter", cellRenderer: nameRenderer, flex: 1 },
        { field: "level", maxWidth: 100, hide: true },
        { field: "grade", minWidth: 80, maxWidth: 80, cellRenderer: gradeTypeRenderer },
        { field: "plate", minWidth: 80, maxWidth: 80, cellRenderer: plateTypeRenderer }
    ];

    let rowData = [];
    if (levelSelect.current && levelSelect.current.value == "level") {
        let subset = userData[level];
        if (subset) {
            rowData = subset.scores;
        }
    }
  
    const onGridReady = useCallback((params) => {
        window.addEventListener('resize', () => {
            setTimeout(() => {
            params.api.sizeColumnsToFit();
            });
        });
        window.addEventListener('click', () => {
            setTimeout(() => {
            params.api.sizeColumnsToFit();
            });
        });
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
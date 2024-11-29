import { useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "./ScoresTable.css";

function PumbilityTable({ rowData }) {
    const levelRenderer = ({ value, data }) => (
        <span className="position-relative level-margins">
            {value && value !== "xx" && 
            <>
            <span className="game-font level-font level-font-margin position-absolute">
                {data.chart.level[0] === "1" ? <span className="onespaceleft"></span> : <></>}
                {data.chart.level[0] === "n" ? "x" : data.chart.level[0]}
                {data.chart.level[0] === "1" ? <span className="onespaceright"></span> : <></>}
                {data.chart.level[1] === "1" ? <span className="onespaceleft"></span> : <></>}
                {data.chart.level[1]}
                {data.chart.level[1] === "1" ? <span className="onespaceright"></span> : <></>}
            </span>
            <img alt={`${data.chart.type}`}
                src={`/images/stepball/${data.chart.type}_bg.png`}
                style={{width: "45px", height: "auto", maxHeight: "80%"}}
            />
            </>
            }
            {value && value === "xx" &&
            <>
            <span className="game-font level-font level-font-margin position-absolute">
                !<span className="onespaceleft"></span><span className="onespaceright"></span>!
            </span>
            </>
            }
        </span>
    );

    const gradeTypeRenderer = ({ value }) => (
        <span className="d-flex h-100 w-100 align-items-center justify-content-center">
            {value && 
                <img alt={`${value}`}
                    src={`/images/grade/${value}.png`}
                    className="d-block"
                    style={{width: "40px", height: "auto", maxHeight: "50%"}}
                />
            }
        </span>
    );

    const nameRenderer = ({ value }) => (
        <span className="name-font d-flex h-100 w-100 align-items-center">
            {value}
        </span>
    );

    const imgRenderer = ({ value }) => (
        <span className="position-relative level-margins" style={{
            marginLeft: "-20px"
        }}>
            <span className="position-absolute" style={{
                backgroundImage: `url(${value})`,
                backgroundPosition: "center center",
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                minWidth: "85px",
                height: "48px"
            }}>
                &nbsp;
            </span>
        </span>
    );

    const rankComparator = function(valueA, valueB) {
        valueA = parseInt(valueA);
        valueB = parseInt(valueB);
        if (valueA !== valueB) {
            return (valueA > valueB) ? 1 : -1;
        }
        return 0;        
    }

    // Column Definitions: Defines & controls grid columns.
    const columnDefs = [
        { field: "ranking", headerName: '', minWidth: 55, maxWidth: 55, comparator: rankComparator, sort: "asc" },
        { field: "score", minWidth: 82, maxWidth: 82},
        { field: "chart.level", headerName: "Level", minWidth: 92, maxWidth: 92, cellRenderer: levelRenderer, sortable: false},
        { field: "grade", minWidth: 82, maxWidth: 82, cellRenderer: gradeTypeRenderer, sortable: false},
        { field: "song.url", headerName: "Image", minWidth: 82, maxWidth: 82, cellRenderer: imgRenderer, sortable: false},
        { field: "song.name", headerName: "Name", cellRenderer: nameRenderer, flex: 1, sortable: false }
    ];
  
    const onGridReady = useCallback((params) => {
        window.addEventListener('resize', () => {
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
                suppressDragLeaveHidesColumns={true}
                rowDragManaged={true}
              />
            </div>
          </div>
        </div>
      </div>
    );
}

export default PumbilityTable;
import { useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import "./ScoresTable.css";

function ChartsTable({ rowData, sortLevel, language }) {
    // Displays {Co-Op, Single, Double} stepball image based on "type" value
    const levelRenderer = ({ value, data }) => (
        <span className="position-relative level-margins">
            {value && value !== "xx" && 
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
                src={`/images/stepball/${data.type}_bg.png`}
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

    const levelComparator = function(valueA, valueB, nodeA, nodeB, isDescending) {
        let levelA = Number(nodeA.data.level.replace(/,/g, ''));
        let levelB = Number(nodeB.data.level.replace(/,/g, ''));
        let typeA = nodeA.data.type;
        let typeB = nodeB.data.type;
        if (levelA !== levelB) {
            return (levelA > levelB) ? 1 : -1;
        }
        if (typeA !== typeB) {
            return (typeA > typeB) ? 1 : -1;
        }
        return 0;
    }

    const levelFilterValueGetter = function(params) {
        return Number(params.data.level.replace(/,/g, ''));
    }

    // Column Definitions: Defines & controls grid columns.
    const nameField = language === "ENGLISH" ? "name" : "name_kr";
    const columnDefs = [
        { field: "type", minWidth: 30, maxWidth: 30, rowDrag: true},
        { field: "level", minWidth: 100, maxWidth: 100, floatingFilter: sortLevel ? true : false, filter: "agNumberColumnFilter", filterValueGetter: levelFilterValueGetter, comparator: levelComparator, cellRenderer: levelRenderer},
        { field: "bg_img", headerName: 'Image', minWidth: 82, maxWidth: 82, cellRenderer: imgRenderer, sortable: false},
        { field: nameField, headerName: 'Name', floatingFilter: true, filter: "agTextColumnFilter", cellRenderer: nameRenderer, flex: 1 }
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

export default ChartsTable;
import ChartTypeSelect from "../Helpers/ChartTypeSelect.js";

function GraphButtons({minValue, maxValue, chartTypeValue, updateLineGraph}) {
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updateLineGraph(event);
        }
    }

    // Common style for the number inputs to ensure they match the selects
    const inputStyle = { maxWidth: '50px' };

    return (
        <div className="d-flex pt-4 align-items-center justify-content-center gap-2">
            <div className="d-flex align-items-center">
                <label className="me-2 text-nowrap" htmlFor="min">Min Level:</label>
                <input 
                    ref={minValue} 
                    className="form-control w-auto rounded-3 bg-secondary bg-opacity-10 text-center px-1" 
                    style={inputStyle}
                    name="min" 
                    type="number" 
                    defaultValue="1" 
                    min="1" 
                    max="29" 
                    onKeyDown={handleKeyDown} 
                    onClick={updateLineGraph} 
                    onBlur={updateLineGraph}
                />
            </div>
            
            <div className="d-flex align-items-center ms-3">
                <label className="me-2 text-nowrap" htmlFor="max">Max Level:</label>
                <input 
                    ref={maxValue} 
                    className="form-control w-auto rounded-3 bg-secondary bg-opacity-10 text-center px-1" 
                    style={inputStyle}
                    name="max" 
                    type="number" 
                    defaultValue="28" 
                    min="1" 
                    max="29" 
                    onKeyDown={handleKeyDown} 
                    onClick={updateLineGraph} 
                    onBlur={updateLineGraph}
                />
            </div>

            <div className="ms-3">
                <ChartTypeSelect
                    innerRef={chartTypeValue}
                    onInput={updateLineGraph}
                />
            </div>
        </div>
    );
}

export default GraphButtons;
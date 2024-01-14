function GraphButtons({minValue, maxValue, chartTypeValue, updateLineGraph}) {
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            updateLineGraph(event);
        }
    }

    return (
        <div className="d-flex pt-4 align-items-center justify-content-center">
            <div className="px-2 text-center">
                <label className="me-2" htmlFor="min">Min Level:</label>
                <input ref={minValue} className="Min-input" name="min" type="number" defaultValue="1" min="1" max="28" previous="1" onKeyDown={handleKeyDown} onClick={updateLineGraph} onBlur={updateLineGraph}></input>
            </div>
            <div className="px-2 text-center">
                <label className="me-2" htmlFor="max">Max Level:</label>
                <input ref={maxValue} className="Max-input" name="max" type="number" defaultValue="28" min="1" max="28" previous="28" onKeyDown={handleKeyDown} onClick={updateLineGraph} onBlur={updateLineGraph}></input>
            </div>
            <div className="px-4 text-center">
                <label className="me-2" htmlFor="chartType">Select Chart Type:</label>
                <select ref={chartTypeValue} name="chartType" defaultValue="bothtypes" onInput={updateLineGraph}>
                    <option value="bothtypes">Singles and Doubles</option>
                    <option value="singles">Singles</option>
                    <option value="doubles">Doubles</option>
                </select>
            </div>
        </div>
    );
}

export default GraphButtons;
function ChartTypeSelect({ innerRef, onInput, coopOption }) {
    return (
        <div className="d-flex align-items-center">
            <label className="me-2 text-nowrap" htmlFor="chartType">Chart Type:</label>
            <select 
                ref={innerRef} 
                className="form-select w-auto rounded-3 bg-secondary bg-opacity-10" 
                name="chartType" 
                defaultValue="bothtypes" 
                onInput={onInput}
            >
                <option value="bothtypes">Singles and Doubles</option>
                <option value="singles">Singles</option>
                <option value="doubles">Doubles</option>
                {coopOption && <option value="coop">CO-OP</option>}
            </select>
        </div>
    );
}

export default ChartTypeSelect;
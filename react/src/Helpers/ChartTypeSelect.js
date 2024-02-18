function ChartTypeSelect({ innerRef, onInput, coopOption, ucsOption }) {
    return (
        <div>
        <label className="me-2" htmlFor="chartType">Chart Type:</label>
        <select ref={innerRef} name="chartType" defaultValue="bothtypes" onInput={onInput}>
            <option value="bothtypes">Singles and Doubles</option>
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            {coopOption ? 
            <option value="coop">CO-OP</option> : <></>
            }
            {ucsOption ? 
            <option value="ucs">UCS</option> : <></>
            }
        </select>
        </div>
    );
}

export default ChartTypeSelect;
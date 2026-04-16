import BreakdownCategory from "./BreakdownCategory.js";
import ChartTypeSelect from "../../Helpers/ChartTypeSelect.js";

function BreakdownHeader({categorySelect, updateCategory, showLevel, chartTypeSelect, handleTypeChange, levelInput, levelValue, handleKeyDown, updateLevel}) {
    return (
        <div className="d-flex mt-4 align-items-center justify-content-between mt-3 mb-4">
            <BreakdownCategory
                innerRef={categorySelect}
                onInput={updateCategory}
            />
            <div className={showLevel ? "visible" : "invisible"}>
                <ChartTypeSelect
                    innerRef={chartTypeSelect}
                    onInput={handleTypeChange}
                    />
            </div>
            <div className={showLevel ? "visible" : "invisible"}>
                <div className="d-flex align-items-center">
                    <label className="me-2 text-nowrap" htmlFor="min">Level:</label>
                    <input 
                        ref={levelInput} 
                        className="form-control w-auto rounded-3 bg-secondary bg-opacity-10" 
                        style={{ maxWidth: '80px' }}
                        name="min" 
                        type="number" 
                        defaultValue={levelValue} 
                        min="1" 
                        max="29" 
                        onKeyDown={handleKeyDown} 
                        onClick={updateLevel} 
                        onBlur={updateLevel}
                    />
                </div>
            </div>
        </div>
    );
}

export default BreakdownHeader;
function BreakdownCategory({ innerRef, onInput }) {
    return (
        <div className="d-flex align-items-center">
            <label className="me-2 text-nowrap" htmlFor="category">Category:</label>
            <select 
                ref={innerRef} 
                className="form-select w-auto rounded-3 bg-secondary bg-opacity-10" 
                name="levelSelect" 
                defaultValue="level" 
                onInput={onInput}
            >
                <option value="level">Level</option>
                <option value="coop">Co-Op</option>
            </select>
        </div>
    );
}

export default BreakdownCategory;
function BreakdownCategory({ innerRef, onInput }) {
    return (
        <>
        <label className="me-2" htmlFor="category">Category:</label>
        <select ref={innerRef} className="h-100" name="levelSelect" defaultValue="level" onInput={onInput}>
            <option value="level">Level</option>
            <option value="coop">Co-Op</option>
        </select>
        </>
    );
}

export default BreakdownCategory;
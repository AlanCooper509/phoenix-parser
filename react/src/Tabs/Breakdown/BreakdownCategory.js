function BreakdownCategory({ innerRef, updateCategory }) {
    return (
        <>
            <label className="me-2" htmlFor="graphType">Category:</label>
            <select ref={innerRef} className="h-100" name="levelSelect" defaultValue="level" onInput={updateCategory}>
                <option value="level">Level</option>
                <option value="coop">Co-Op</option>
                <option value="ucs">UCS</option>
        </select>
        </>
    );
}

export default BreakdownCategory;
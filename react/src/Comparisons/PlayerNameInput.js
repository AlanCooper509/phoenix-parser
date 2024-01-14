function PlayerNameInput({innerRef, label, tag, addPlayerHandler}) {
    const addPlayerOnEnter = (event) => {
        if (event.key !== 'Enter') { return }
        addPlayerHandler(event);
    }

    return (
        <div className="d-flex flex-column align-items-start mt-2">
            <label htmlFor={tag}>{label}</label>
            <div className="d-flex align-items-center justify-content-center mt-2 mb-5">
                <input ref={innerRef} className="mx-2" name={tag} placeholder="NAME #1234" onKeyDown={addPlayerOnEnter} onBlur={addPlayerHandler}></input>
                <span className="border-dark btn btn-sm btn-secondary" name={tag} onClick={addPlayerHandler}>Add</span>
            </div>
        </div>
    );
}

export default PlayerNameInput;
function splitNameNumber(input) {
    let splitter = " #";
    if (!input.includes(splitter)) { splitter = "#"; }
    if (!input.includes(splitter)) { return; }

    const name = input.split(splitter)[0];
    const number = input.split(splitter)[1];
    return {
        name: name,
        number: number
    }
}

export default splitNameNumber;
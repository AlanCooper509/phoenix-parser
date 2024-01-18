function checkUpdatedToday(last_updated) {
    if (last_updated === "Unknown") {
        return true; // handle initial page render before info retrieved
    }
    const dateArray = last_updated.split("/");
    const year = parseInt("20" + dateArray[2]);
    const month = parseInt(dateArray[0]) - 1;
    const date = parseInt(dateArray[1]);
    let d = new Date();

    return d.getDate() === date && d.getMonth() === month && d.getFullYear() === year;
}

export default checkUpdatedToday;
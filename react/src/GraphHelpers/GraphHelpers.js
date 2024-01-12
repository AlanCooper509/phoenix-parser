class GraphHelpers {
    validateFormInputs(chartTypeValue, minValue, maxValue, changedInput) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let min = minValue.current ? parseInt(minValue.current.value) : 1;
        let minPrev = minValue.current ? minValue.current.getAttribute("previous") : 1;
        let max = maxValue.current ? parseInt(maxValue.current.value) : 28;
        let maxPrev = maxValue.current ? maxValue.current.getAttribute("previous") : 28;
    
        if (changedInput) {
            switch (changedInput.target.id) {
                case "min":
                    if (isNaN(min)) {
                        min = minPrev;
                    } else {
                        min = min < 1 ? 1 : (min > 28 ? 28 : min > max ? max : min);
                        minValue.current.value = min;
                        minValue.current.setAttribute("previous", min);
                    }
                    break;
                case "max":
                    if (isNaN(max)) {
                        max = maxPrev;
                        break;
                    }
                    max = max < 1 ? 1 : max > 28 ? 28 : max < min ? min : max;
                    maxValue.current.value = max;
                    maxValue.current.setAttribute("previous", max);
                    break;
                default:
                    break;
            }
        }
    
        const userSettings = {"min": min, "max": max, "chartType": chartType};
        return userSettings;
    }
    makeLevelLabels(inputs) {
        let labels = [];
        for (let i = inputs["min"]; i <= inputs["max"]; i++) {
            let label = i < 10 ? `0${i}` : i.toString();
            labels.push(label);
        }
        return labels;
    }
    getAveragesForKeys(data, labels, chartTypeValue) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let averages = [];
        for (const idx in labels) {
            switch (chartType) {
                case ("bothtypes"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["average"] : NaN);
                    break;
                case ("singles"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["singles"]["average"] : NaN);
                    break;
                case ("doubles"):
                    averages.push(data[labels[idx]] ? data[labels[idx]]["doubles"]["average"] : NaN);
                    break;
            }
        }
        return averages;
    }
    getClearPercentForKeys(data, labels, chartTypeValue) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let percentages = [];
        for (const idx in labels) {
            switch (chartType) {
                case ("bothtypes"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["clear"] : 0.00);
                    break;
                case ("singles"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["singles"]["clear"] : 0.00);
                    break;
                case ("doubles"):
                    percentages.push(data[labels[idx]] ? data[labels[idx]]["doubles"]["clear"] : 0.00);
                    break;
            }
        }
        return percentages;
    }
    getSubtitle(lastSynced) {
        const rightPadding = " ".repeat(24);
        const subtitle = `Last Synced: ${lastSynced}${rightPadding}`;
        return subtitle;
    }
    getTitle(player, chartTypeValue) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        let typeText = '';
        switch (chartType) {
            case "bothtypes":
                typeText = "Singles and Doubles";
                break;
            case "singles":
                typeText = "Singles";
                break;
            case "doubles":
                typeText = "Doubles";
                break;
            case "coop":
                typeText = "Co-Op";
                break;
        }
        const title = `${player} (${typeText})`;
        return title;
    }
}

export default GraphHelpers
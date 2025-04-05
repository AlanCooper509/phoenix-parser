class GraphHelpers {
    makeLevelLabelsFromInputs(chartTypeValue, minValue, maxValue, changedInput) {
        function validateFormInputs(chartTypeValue, minValue, maxValue, changedInput) {
            const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
            let min = minValue.current ? parseInt(minValue.current.value) : 1;
            let minPrev = minValue.current ? minValue.current.getAttribute("previous") : 1;
            let max = maxValue.current ? parseInt(maxValue.current.value) : 29;
            let maxPrev = maxValue.current ? maxValue.current.getAttribute("previous") : 29;
        
            if (changedInput) {
                switch (changedInput.target.getAttribute("name")) {
                    case "min":
                        if (isNaN(min)) {
                            min = minPrev;
                        } else {
                            min = min < 1 ? 1 : (min > 29 ? 29 : min > max ? max : min);
                            minValue.current.value = min;
                            minValue.current.setAttribute("previous", min);
                        }
                        break;
                    case "max":
                        if (isNaN(max)) {
                            max = maxPrev;
                            break;
                        }
                        max = max < 1 ? 1 : max > 29 ? 29 : max < min ? min : max;
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
        function  makeLevelLabels(inputs) {
            let labels = [];
            for (let i = inputs["min"]; i <= inputs["max"]; i++) {
                let label = i < 10 ? `0${i}` : i.toString();
                if (label === '29') { label = '??'; }
                labels.push(label);
            }
            return labels;
        }

        const inputs = validateFormInputs(chartTypeValue, minValue, maxValue, changedInput);
        return makeLevelLabels(inputs);
    }
    getDatasetFromLabels(property, data, labels, chartTypeValue) {
        const chartType = chartTypeValue.current == null ? "bothtypes" : chartTypeValue.current.value;
        const defaultValues = {"average": NaN, "clear": 0.00}

        let dataset = [];
        for (const idx in labels) {
            const level = labels[idx];
            switch (chartType) {
                case ("bothtypes"):
                    dataset.push(data[level] ? data[level][property] : defaultValues[property]);
                    break;
                case ("singles"):
                    dataset.push(data[level] ? data[level]["singles"][property] : defaultValues[property]);
                    break;
                case ("doubles"):
                    dataset.push(data[level] ? data[level]["doubles"][property] : defaultValues[property]);
                    break;
                default:
                    break;
            }
        }
        return dataset;
    }
    getSubtitle(text) {
        const rightPadding = " ".repeat(24);
        const subtitle = `${text}${rightPadding}`;
        return subtitle;
    }
    updateGraphData(chartRef, labels, datasets, title, subtitle) {
        chartRef.current.data.labels = labels;
        for (const idx in datasets) {
            chartRef.current.data.datasets[idx].data = datasets[idx].data;
            chartRef.current.data.datasets[idx].label = datasets[idx].label;
            chartRef.current.data.datasets[idx].type = datasets[idx].type;
            chartRef.current.data.datasets[idx].yAxisID = datasets[idx].yAxisID;
        }
        chartRef.current.options.plugins.title.text = title;
        chartRef.current.options.plugins.subtitle.text = subtitle;
        chartRef.current.update();
    }
}

export default GraphHelpers
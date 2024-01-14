import GraphHelpers from "./GraphHelpers.js";

class ComparisonsGraphHelper extends GraphHelpers {
    getGraphSetupObject(labels, multipleUsersData, title, subtitle) {
        const colors = [
            'rgba(54, 162, 235, 0.75)', 
            'rgba(187, 36, 0, 0.75)', 
            'rgba(255, 206, 86, 0.75)', 
            'rgba(204, 101, 254, 0.75)', 
            'rgba(0, 255, 0, 0.75)'];
        let datasets = [];
        for (const idx in multipleUsersData) {
            let dataset = {
                type: "line",
                label: multipleUsersData[idx].label,
                data: multipleUsersData[idx].data,
                borderWidth: 1,
                yAxisID: "y",
                borderColor: colors[idx % colors.length],
                backgroundColor: colors[idx % colors.length]
            }
            datasets.push(dataset);
        }
        return {
            title: title,
            subtitle: subtitle,
            chartData: {
                labels: labels,
                datasets: datasets
            }
        }
    }
    getTitle(dataCategory) {
        let category = '';
        switch (dataCategory) {
            case "average":
                category = "Average Scores";
                break;
            case "clear":
                category = "Percent Cleared";
                break;
            default:
                break;
        }
        const leftPadding = " ".repeat(18);
        const title = `${leftPadding}${category} Comparison`;
        return title;
    }
    getSubtitle(chartTypeValue) {
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
            default:
                typeText = "None";
                break;
        }
        const leftPadding = " ".repeat(30);
        const subtitle = `${leftPadding}(${typeText})`;
        return subtitle;
    }
    updateGraph(chartRef, labels, datasets, chartTypeValue, graphType, changedInput) {
        let dataCategory = graphType.current == null ? "average" : graphType.current.value;
        let playersData = [];
        for (const idx in datasets) {
            const playerData = this.getDatasetFromLabels(dataCategory, datasets[idx].data, labels, chartTypeValue);
            const label = datasets[idx].label;
            playersData.push({data: playerData, label: label});
        }
        const subtitle = this.getSubtitle(chartTypeValue);
        const title = this.getTitle(dataCategory);

        if (changedInput) {
            this.updateGraphData(chartRef, labels, playersData, title, subtitle);
        } else {
            const graphSetup = this.getGraphSetupObject(labels, playersData, title, subtitle);
            return graphSetup;
        }
    }
}

export default ComparisonsGraphHelper;
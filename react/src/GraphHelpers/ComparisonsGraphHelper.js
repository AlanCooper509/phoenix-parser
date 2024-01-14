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
    getTitle() {
        const leftPadding = " ".repeat(18);
        const title = `${leftPadding}Average Scores Comparison`;
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
    updateGraph(chartRef, labels, datasets, chartTypeValue, changedInput) {
        let playersData = [];
        for (const idx in datasets) {
            const playerData = this.getDatasetFromLabels("average", datasets[idx].data, labels, chartTypeValue);
            const label = datasets[idx].label;
            playersData.push({data: playerData, label: label});
        }
        const subtitle = this.getSubtitle(chartTypeValue);
        const title = this.getTitle();

        if (changedInput) {
            this.updateGraphData(chartRef, labels, playersData, title, subtitle);
        } else {
            const graphSetup = this.getGraphSetupObject(labels, playersData, title, subtitle);
            return graphSetup;
        }
    }
}

export default ComparisonsGraphHelper;
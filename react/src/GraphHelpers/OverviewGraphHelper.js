import GraphHelpers from "./GraphHelpers.js";

class OverviewGraphHelper extends GraphHelpers {
    getGraphSetupObject(labels, datasets, title, subtitle) {
        return {
            "subtitle": subtitle,
            "title": title,
            "chartData": {
                labels: labels,
                datasets: [{
                    type: datasets[0].type,
                    label:  datasets[0].label,
                    data: datasets[0].data,
                    yAxisID: datasets[0].yAxisID,
                    borderWidth: 1
                }, {
                    type: datasets[1].type,
                    label: datasets[1].label,
                    data: datasets[1].data,
                    yAxisID: datasets[1].yAxisID
                }]
            }
        }
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
            default:
                typeText = "None";
                break;
        }
        const title = `${player} (${typeText})`;
        return title;
    }
    getSubtitle(lastSynced) {
        const rightPadding = " ".repeat(24);
        const subtitle = `Last Synced: ${lastSynced}${rightPadding}`;
        return subtitle;
    }
    updateGraph(chartRef, labels, data, info, chartTypeValue, changedInput) {
        let datasets = [];
        const averages = this.getDatasetFromLabels("average", data, labels, chartTypeValue);
        const percentages = this.getDatasetFromLabels("clear", data, labels, chartTypeValue);
        datasets.push({data: averages, label: "AVG SCORE", type: "line", yAxisID: "y"});
        datasets.push({data: percentages, label: "% CLEARED", type: "bar", yAxisID: "y1"});
        const subtitle = this.getSubtitle(info["last_updated"]);
        const title = this.getTitle(info["player"], chartTypeValue);
    
        if (changedInput) {
            this.updateGraphData(chartRef, labels, datasets, title, subtitle);
        } else {
            const graphSetup = this.getGraphSetupObject(labels, datasets, title, subtitle);
            return graphSetup;
        }
    }
}

export default OverviewGraphHelper;
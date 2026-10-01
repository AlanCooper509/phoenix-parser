import readJsonFromAssets from '../helpers/assets_readJson.js';

async function getChartStats() {
    // get level counts JSON from the public piu-assets bucket (cached in memory)
    const charts = await readJsonFromAssets("phx1/charts/counts.json");
    return charts;
}

export default getChartStats;

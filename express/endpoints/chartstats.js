import readJsonFromAssets from '../helpers/assets_readJson.js';

async function getChartStats(game) {
    // get level counts JSON from the public piu-assets bucket (cached in memory)
    const charts = await readJsonFromAssets(`${game.chartsDir}/counts.json`);
    return charts;
}

export default getChartStats;

import readJsonFromAssets from '../helpers/assets_readJson.js';

async function getChartStats(req) {
    const value = req.params.value;
    // only "01".."29" or "coop": the value becomes part of the asset URL
    if (!/^(0[1-9]|1[0-9]|2[0-9]|coop)$/.test(value)) {
        return {
            error: {
                code: 400,
                message: `Invalid chart level: ${value}`
            }
        }
    }

    // get charts JSON for a given level from the public piu-assets bucket (cached in memory)
    let objectName = "phx1/charts/";
    if (value === "coop") {
        objectName += `coop.json`;
    } else {
        objectName += `level${value}.json`
    }

    const charts = await readJsonFromAssets(objectName);
    return charts;
}

export default getChartStats;

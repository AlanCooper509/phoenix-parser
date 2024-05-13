import 'dotenv/config';

import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';

async function getChartStats(req) {
    const value = req.params.value;

    // get charts JSON for a given level from OCI: Object Storage
    let objectName = process.env.CHARTS_DIR;
    if (value === "coop") {
        objectName += `coop.json`;
    } else {
        objectName += `level${value}.json`        
    }
    console.log(objectName);

    const charts = await readJsonFromObjectStorage(objectName);
    return charts;
}

export default getChartStats;
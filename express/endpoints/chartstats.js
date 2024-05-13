import 'dotenv/config';

import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';

async function getChartStats() {
    // get level counts JSON from OCI: Object Storage
    const objectName = process.env.CHARTS_DIR + process.env.LEVEL_COUNTS;
    const charts = await readJsonFromObjectStorage(objectName);
    return charts;
}

export default getChartStats;
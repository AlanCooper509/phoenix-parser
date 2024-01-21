import 'dotenv/config';

import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';

async function getChartStats() {
    // get level counts JSON from OCI: Object Storage
    const objectName = process.env.LEVEL_COUNTS_OBJECT_NAME;
    const charts = await readJsonFromObjectStorage(objectName);
    return charts;
}

export default getChartStats;
import axios from 'axios';

import getHostPath from './getHostPath';

// resolves to chart counts per level (from counts.json)
async function getChartStats() {
    const response = await axios.get(`${getHostPath()}/api/charts/stats`);
    return response.data;
}

export default getChartStats;

import axios from 'axios';

import getHostPath from './getHostPath';
import { isMockMode, mockChartStats } from './mockData';

// resolves to chart counts per level (from counts.json)
async function getChartStats(game) {
    if (isMockMode) {
        return mockChartStats();
    }
    const response = await axios.get(`${getHostPath()}/api/${game}/charts/stats`);
    return response.data;
}

export default getChartStats;

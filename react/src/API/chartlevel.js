import axios from 'axios';

import getHostPath from './getHostPath';

// resolves to the chart list for a level ("01".."29") or "coop"
async function getChartsForLevel(game, level) {
    const response = await axios.get(`${getHostPath()}/api/${game}/charts/level/${level}`);
    return response.data;
}

export default getChartsForLevel;

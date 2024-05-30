import axios from 'axios';

import getHostPath from './getHostPath';

function getChartsForLevel(level, callback) {
    const fetchData = async () => {
        const hostname = getHostPath();
        try {
            const response = await axios.get(`${hostname}/api/charts/level/${level}`);
            const responseData = response.data;

            // Update state or perform actions with the data
            callback(responseData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}

export default getChartsForLevel;
import axios from 'axios';

import url from './url_params.json';

function getChartsForLevel(level, callback) {
    const fetchData = async () => {
        try {
            const response = await axios.get(`${url.protocol}://${url.host}:${url.port}/api/charts/level/${level}`);
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
import axios from 'axios';

import getHostPath from './getHostPath';

function getChartStats(setChartStats) {
    const fetchData = async () => {
        const hostname = getHostPath();
        try {
            const response = await axios.get(`${hostname}/api/charts/stats`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setChartStats(responseData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData();
}

export default getChartStats;
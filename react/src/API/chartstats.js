import axios from 'axios';

import url from './url_params.json';

function getChartStats(setChartStats) {
    const fetchData = async () => {
        try {
            const response = await axios.get(`${window.location.protocol}//${url.host}:${url.port}/api/charts/stats`);
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
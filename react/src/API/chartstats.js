import axios from 'axios';

function getChartStats(setChartStats) {
    const fetchData = async () => {
        try {
            const response = await axios.get(`http://192.168.1.71:3001/api/charts/stats`);
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
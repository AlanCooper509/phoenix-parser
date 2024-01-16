import axios from 'axios';

import url from './url_params.json';

function postSyncData(name, number, sid) {
    const fetchData = async (name, number, sid) => {
        try {
            const response = await axios.post(`${url.protocol}://${url.host}:${url.port}/api/sync/${name}/${number}`, {
                sid: sid
            });
            const responseData = response.data;

            // Update state or perform actions with the data
            console.log(responseData);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData(name, number, sid);
}

export default postSyncData;
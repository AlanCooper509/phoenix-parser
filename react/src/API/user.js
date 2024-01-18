import axios from 'axios';

import url from './url_params.json';

function getUser(setInfo, setData, setTitles, name, number) {
    const fetchData = async (name, number) => {
        try {
            const response = await axios.get(`${url.protocol}://${url.host}:${url.port}/api/user/${name}/${number}`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setInfo(responseData["info"]);
            setData(responseData["scores"]);
            setTitles(responseData["titles"]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData(name, number);
}

export default getUser;
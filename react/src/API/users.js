import axios from 'axios';

import url from './url_params.json';

function getUsers(setUsers) {
    const fetchData = async () => {
        try {
            const response = await axios.get(`${url.protocol}://${url.host}:${url.port}/api/users/`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setUsers(responseData["users"]);
        } catch (error) {
            setUsers([]);
        }
    };

    fetchData();
}

export default getUsers;
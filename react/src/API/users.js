import axios from 'axios';

import getHostPath from './getHostPath';

// resolves to the list of synced users (most recent first), optionally filtered by name
async function getUsers(game, name = '') {
    const response = await axios.get(`${getHostPath()}/api/${game}/users/${name}`);
    return response.data["users"];
}

export default getUsers;

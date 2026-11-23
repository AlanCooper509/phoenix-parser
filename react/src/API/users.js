import axios from 'axios';

import getHostPath from './getHostPath';
import { isMockMode, mockUsers } from './mockData';

// resolves to the list of synced users (most recent first), optionally filtered by name
async function getUsers(game, name = '') {
    if (isMockMode) {
        return mockUsers(name);
    }
    const response = await axios.get(`${getHostPath()}/api/${game}/users/${name}`);
    return response.data["users"];
}

export default getUsers;

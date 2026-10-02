import axios from 'axios';

import getHostPath from './getHostPath';

// placeholder profile for a user that has never synced (or couldn't be loaded)
export function newUserInfo(name, number) {
    return {player: name, number: '#' + number, title: {text: "BEGINNER", color: "col5"}, last_updated: "Never"};
}

// resolves to { info, scores, titles, pumbility }
async function getUser(name, number) {
    const response = await axios.get(`${getHostPath()}/api/user/${name}/${number}`);
    return response.data;
}

export default getUser;

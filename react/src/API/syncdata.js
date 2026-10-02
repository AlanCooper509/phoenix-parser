import axios from 'axios';

import getHostPath from './getHostPath';

// resolves to { info, scores, titles, pumbility } counts from the sync;
// rejects with an Error whose message is meant for the user
async function postSyncData(game, name, number, sid) {
    try {
        const response = await axios.post(`${getHostPath()}/api/${game}/sync/${name}/${number}`, {
            sid: sid
        });
        return response.data;
    } catch (error) {
        if (error.code === "ERR_NETWORK" || !error.response) {
            throw new Error("Network Error... Please try again later.");
        }
        throw new Error(error.response.data);
    }
}

export default postSyncData;

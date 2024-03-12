import getDocuments from '../helpers/adb_getDocuments.js';

async function getUsers(req) {
    let users = [];

    const collectionName = 'info_collection';
    const filterSpec = {
        "$orderby": [{ 
            "path": "info.timestamp",
            "datatype": "number",
            "order": "desc" }
        ]
    };

    try {
        users = await getDocuments(collectionName, filterSpec);
    } catch (error) {
        console.log(error);
        return {
            error: {
                code: 500,
                message: "Error: unable to retrieve users! Try again later."
            }
        }
    }

    return {users};
}

export default getUsers;
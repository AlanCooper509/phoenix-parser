import getDocuments from '../helpers/adb_getDocuments.js';

async function getUsers(req) {
    let users = [];
    let myDocuments;

    const collectionName = 'userinfo_collection';
    const filterSpec = {};

    try {
        myDocuments = await getDocuments(collectionName, filterSpec);
    } catch (error) {
        return {
            error: {
                code: 500,
                message: "Error: unable to retrieve users! Try again later."
            }
        }
    }

    myDocuments.forEach(function(element) {
        let content = element.getContent();
        users.push(content);
    });

    return {users};
}

export default getUsers;
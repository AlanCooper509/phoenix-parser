import 'dotenv/config';

import oracledb from 'oracledb';

import getClientOpts from './adb_getClientOpts.js';
import createCollection from './adb_createCollection.js';
import getConnectionOpts from './adb_getConnectionOpts.js';

async function getDocuments(collectionName, filterSpec) {
    oracledb.autoCommit = true;
    oracledb.initOracleClient(getClientOpts());

    let connection = await oracledb.getConnection(getConnectionOpts());

    // Get collection
    const soda = connection.getSodaDatabase();
    const myCollection = await createCollection(soda, collectionName);

    // Get filtered documents
    // const mySodaDocuments = await myCollection.find().filter(filterSpec).getDocuments();
    const cursor = await myCollection.find().filter(filterSpec).getCursor();
    let myDocuments = [];
    try {
        let doc;
        while (doc = await cursor.getNext()) {
            let content = doc.getContent();
            myDocuments.push(content);
        }
    } catch (e) {
        console.log(e);
        console.log(`WARNING: only fetched ${myDocuments.length} users`);
    }
    cursor.close();
    connection.close();

    return myDocuments;
}

export default getDocuments;
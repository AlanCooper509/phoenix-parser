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
    const mySodaDocuments = await myCollection.find().filter(filterSpec).getDocuments();

    let myDocuments = [];
    mySodaDocuments.forEach(function(element) {
        let content = element.getContent();
        myDocuments.push(content);
    });

    connection.close();

    return myDocuments;
}

export default getDocuments;
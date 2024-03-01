import 'dotenv/config';

import oracledb from 'oracledb';

import getClientOpts from './adb_getClientOpts.js';
import createCollection from './adb_createCollection.js';
import getConnectionOpts from './adb_getConnectionOpts.js';

async function saveDocument(collectionName, jsonDocument, key) {
    oracledb.autoCommit = true;
    oracledb.initOracleClient(getClientOpts());

    let connection = await oracledb.getConnection(getConnectionOpts());

    // Get collection
    const soda = connection.getSodaDatabase();
    const myCollection = await createCollection(soda, collectionName);

    // Create and Save a document (updates existing)
    const newDocument = soda.createDocument(jsonDocument, {key: key});
    const myDocument = await myCollection.saveAndGet(newDocument);

    connection.close();

    return myDocument;
}

export default saveDocument;
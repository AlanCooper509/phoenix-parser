import oracledb from 'oracledb';
import createCollection from './adb_createCollection.js';
import getConnectionOpts from './adb_getConnectionOpts.js';

try {
    if (process.platform === 'win32') {
        oracledb.initOracleClient({ libDir: process.env.ORACLE_INSTANT_CLIENT_PATH });
    } else {
        // Linux logic: Use system-installed libraries
        oracledb.initOracleClient(); 
    }
} catch (err) {
    // Already initialized
}

async function saveDocument(collectionName, jsonDocument, key) {
    let connection;
    try {
        connection = await oracledb.getConnection(getConnectionOpts());
        const soda = connection.getSodaDatabase();
        const myCollection = await createCollection(soda, collectionName);

        const newDocument = soda.createDocument(jsonDocument, {key: key});
        const myDocument = await myCollection.saveAndGet(newDocument);
        await connection.commit();

        return myDocument;
    } catch (e) {
        console.error("Error in saveDocument:", e);
        if (connection) await connection.rollback();
        throw e;
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

export default saveDocument;
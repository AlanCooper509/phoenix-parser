import 'dotenv/config';

import oracledb from 'oracledb';

async function getDocuments(collectionName, filterSpec) {
    oracledb.autoCommit = true;
    let clientOpts;
    if (process.platform === 'win32') {
        // Windows
        clientOpts = { libDir: process.env.ORACLE_INSTANT_CLIENT_PATH };
    } else if (process.platform === 'darwin' && process.arch === 'x64') {
        // macOS Intel
        clientOpts = { libDir: process.env.ORACLE_INSTANT_CLIENT_PATH };
    } else {
        // Linux/etc
        // the system library search path **must already be set before running node**
        clientOpts = {};
    }

    oracledb.initOracleClient(clientOpts);

    let connection = await oracledb.getConnection( {
        user          : process.env.ADB_USERNAME,
        password      : process.env.ADB_PASSWORD,
        connectString : process.env.ADB_CONNECT
    });

    // Get collection
    const soda = connection.getSodaDatabase();
    const myCollection = await soda.createCollection(collectionName);

    // Get filtered documents
    const myDocuments = await myCollection.find().filter(filterSpec).getDocuments();

    return myDocuments;
}

export default getDocuments;
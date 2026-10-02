import oracledb from './adb_init.js';
import getConnectionOpts from './adb_getConnectionOpts.js';

async function getDocuments(collectionName, filterSpec) {
    let connection;
    try {
        connection = await oracledb.getConnection(getConnectionOpts());
        
        const soda = connection.getSodaDatabase();
        const myCollection = await soda.openCollection(collectionName);

        const cursor = await myCollection.find().filter(filterSpec).getCursor();
        let myDocuments = [];
        
        let doc;
        while (doc = await cursor.getNext()) {
            myDocuments.push(doc.getContent());
        }
        
        await cursor.close();
        return myDocuments;
    } catch (e) {
        console.error("Database Error:", e);
        throw e; 
    } finally {
        if (connection) {
            await connection.close();
        }
    }
}

export default getDocuments;
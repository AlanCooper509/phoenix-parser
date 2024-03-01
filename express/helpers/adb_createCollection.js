import 'dotenv/config';

const metadata = {
    "schemaName": process.env.ADB_USERNAME,
    "tableName": "myCollectionName",
    "keyColumn":
    {
        "name": "ID",
        "sqlType": "VARCHAR2",
        "maxLength": 255,
        "assignmentMethod": "CLIENT"
    },
    "contentColumn":
    {
        "name": "JSON_DOCUMENT",
        "sqlType": "BLOB",
    },
    "versionColumn":
    {
        "name": "VERSION",
        "method": "UUID"
    },
    "lastModifiedColumn":
    {
        "name": "LAST_MODIFIED"
    },
    "creationTimeColumn":
    {
        "name": "CREATED_ON"
    },
    "readOnly": false
}

async function createCollection(soda, collectionName) {
    const myCollection = await soda.createCollection(collectionName, {metaData: metadata});
    return myCollection;
}

export default createCollection;
import 'dotenv/config';

import getObjectStorageClient from './os_client.js';

async function uploadObjectToObjectStorage(objectName, objectBody) {
    const client = getObjectStorageClient();

    try {
        const putObjectRequest = {
            namespaceName: process.env.OCI_BUCKET_NAMESPACE_NAME,
            bucketName: process.env.OCI_BUCKET_NAME,
            objectName: objectName,
            putObjectBody: objectBody,
        };

        // making the call to OCI: Object Storage
        // put returns no body: reaching here means it succeeded
        await client.putObject(putObjectRequest);
        return {};
    } catch (error) {
        return {
            error: {
                code: error.statusCode,
                message: "Unable to put a new file into Object Storage"
            }
        }
    }
}

export default uploadObjectToObjectStorage;
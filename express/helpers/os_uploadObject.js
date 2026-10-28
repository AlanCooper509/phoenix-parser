import 'dotenv/config';

import getObjectStorageClient from './os_client.js';

// Puts the object, returning {} or { error }. `ifMatch` (an eTag) only replaces that version of it,
// and `ifNoneMatch: '*'` only creates it: otherwise the put fails with error code 412.
async function uploadObjectToObjectStorage(objectName, objectBody, { ifMatch, ifNoneMatch } = {}) {
    const client = getObjectStorageClient();

    try {
        const putObjectRequest = {
            namespaceName: process.env.OCI_BUCKET_NAMESPACE_NAME,
            bucketName: process.env.OCI_BUCKET_NAME,
            objectName: objectName,
            putObjectBody: objectBody,
            ...(ifMatch && { ifMatch }),
            ...(ifNoneMatch && { ifNoneMatch }),
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
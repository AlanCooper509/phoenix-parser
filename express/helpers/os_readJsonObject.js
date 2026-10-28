import 'dotenv/config';

import getObjectStorageClient from './os_client.js';

// The parsed JSON, or { error }. With `withETag`, { json, eTag } instead: the object's version, for a
// conditional upload (uploadObjectToObjectStorage's ifMatch) that fails if it changed since.
async function readJsonFromObjectStorage(objectName, { withETag = false } = {}) {
    const client = getObjectStorageClient();

    try {
        const getObjectRequest = {
            objectName: objectName,
            bucketName: process.env.OCI_BUCKET_NAME,
            namespaceName: process.env.OCI_BUCKET_NAMESPACE_NAME,
            compartmentId: process.env.OCI_BUCKET_COMPARTMENT_ID
        };

        // making the call to OCI: Object Storage
        const getObjectResponse = await client.getObject(getObjectRequest);

        // Reading Object Response
        const chunks = [];
        for await (const chunk of getObjectResponse.value) {
            chunks.push(chunk);
        }
        const jsonObject = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        return withETag ? { json: jsonObject, eTag: getObjectResponse.eTag } : jsonObject;
    } catch (error) {
        return {
            error: {
                code: error.statusCode,
                message: "Unable to retrieve a requested JSON Object in Object Storage"
            }
        }
    }
}

export default readJsonFromObjectStorage;
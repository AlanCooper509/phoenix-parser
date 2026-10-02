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
        const putObjectResponse = await client.putObject(putObjectRequest);

        // Reading Object Response
        const chunks = [];
        for await (const chunk of putObjectResponse.value) {
            chunks.push(Buffer.from(chunk));
        }
        const jsonObject = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
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
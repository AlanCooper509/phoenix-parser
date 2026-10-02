import 'dotenv/config';

import getObjectStorageClient from './os_client.js';

async function renameObjectInObjectStorage(oldObjectName, newObjectName) {
    const client = getObjectStorageClient();

    try {
        const renameObjectRequest = {
            namespaceName: process.env.OCI_BUCKET_NAMESPACE_NAME,
            bucketName: process.env.OCI_BUCKET_NAME,
            renameObjectDetails: {
                sourceName: oldObjectName,
                newName: newObjectName,
            }
        };

        // making the call to OCI: Object Storage
        const renameObjectResponse = await client.renameObject(renameObjectRequest);

        // Reading Object Response
        const chunks = [];
        for await (const chunk of renameObjectResponse.value) {
            chunks.push(Buffer.from(chunk));
        }
        const jsonObject = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
        return jsonObject;
    } catch (error) {
        return {
            error: {
                code: error.statusCode,
                message: "Unable to retrieve a requested JSON Object in Object Storage"
            }
        }
    }
}

export default renameObjectInObjectStorage;
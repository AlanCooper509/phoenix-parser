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
        // rename returns no body: reaching here means it succeeded
        await client.renameObject(renameObjectRequest);
        return {};
    } catch (error) {
        return {
            error: {
                code: error.statusCode,
                message: `Unable to rename ${oldObjectName} in Object Storage`
            }
        }
    }
}

export default renameObjectInObjectStorage;
import 'dotenv/config';

import common from 'oci-common'
import os from 'oci-objectstorage'

async function renameObjectInObjectStorage(oldObjectName, newObjectName) {
    const provider = new common.ConfigFileAuthenticationDetailsProvider(
        process.env.OCI_CONFIG_PATH,
        process.env.OCI_CONFIG_PROFILE
    );

    const client = new os.ObjectStorageClient({
        authenticationDetailsProvider: provider
    });

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
        console.log(jsonObject);
        // return jsonObject;
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
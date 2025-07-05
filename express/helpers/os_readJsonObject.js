import 'dotenv/config';

import common from 'oci-common'
import os from 'oci-objectstorage'

async function readJsonFromObjectStorage(objectName) {
    const provider = new common.ConfigFileAuthenticationDetailsProvider(
        process.env.OCI_CONFIG_PATH,
        process.env.OCI_CONFIG_PROFILE
    );

    const client = new os.ObjectStorageClient({
        authenticationDetailsProvider: provider
    });

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

export default readJsonFromObjectStorage;
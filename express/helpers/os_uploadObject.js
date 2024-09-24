import 'dotenv/config';

import common from 'oci-common'
import os from 'oci-objectstorage'

async function uploadObjectToObjectStorage(objectName, objectBody) {
    const provider = new common.ConfigFileAuthenticationDetailsProvider(
        process.env.OCI_CONFIG_PATH,
        process.env.OCI_CONFIG_PROFILE
    );

    const client = new os.ObjectStorageClient({
        authenticationDetailsProvider: provider
    });

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
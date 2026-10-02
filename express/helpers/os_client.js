import 'dotenv/config';

import common from 'oci-common'
import os from 'oci-objectstorage'

// one Object Storage client for the whole process, instead of re-reading the
// OCI config/key file and building a new client on every request
let client;

function getObjectStorageClient() {
    if (!client) {
        const provider = new common.ConfigFileAuthenticationDetailsProvider(
            process.env.OCI_CONFIG_PATH,
            process.env.OCI_CONFIG_PROFILE
        );
        client = new os.ObjectStorageClient({
            authenticationDetailsProvider: provider
        });
    }
    return client;
}

export default getObjectStorageClient;

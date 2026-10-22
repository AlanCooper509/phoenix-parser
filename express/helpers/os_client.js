import 'dotenv/config';

import common from 'oci-common'
import os from 'oci-objectstorage'

// The SDK logs every failed request itself, including the expected 404s for users without
// files yet, and callers here already turn those into { error }. Its default circuit breaker
// console.logs the whole error object (the bulk of the pm2 log), so this client goes without
// one; the retrier's one-line console.warn has no setting, so its "not found" ones are filtered
// out below (other failures, e.g. auth, still get logged).
const warn = console.warn;
console.warn = (...args) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (message.startsWith('Request cannot be retried. Not Retrying.') && message.includes('was not found')) {
        return;
    }
    warn(...args);
};

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
        }, {
            circuitBreaker: new common.CircuitBreaker({ disableClientCircuitBreaker: true })
        });
    }
    return client;
}

export default getObjectStorageClient;

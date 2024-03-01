function getClientOpts() {
    let clientOpts = {};
    if (process.platform === 'win32') {
        // Windows
        clientOpts = { libDir: process.env.ORACLE_INSTANT_CLIENT_PATH };
    } else if (process.platform === 'darwin' && process.arch === 'x64') {
        // macOS Intel
        clientOpts = { libDir: process.env.ORACLE_INSTANT_CLIENT_PATH };
    } else {
        // Linux/etc
        // the system library search path **must already be set before running node**
        clientOpts = {};
    }
    return clientOpts;
}

export default getClientOpts;
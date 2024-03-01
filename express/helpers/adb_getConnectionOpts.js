import 'dotenv/config';

function getConnectionOpts() {
    return {
        user          : process.env.ADB_USERNAME,
        password      : process.env.ADB_PASSWORD,
        connectString : process.env.ADB_CONNECT
    }
}

export default getConnectionOpts;
import 'dotenv/config';
import oracledb from 'oracledb';

// Thick-mode Oracle client setup, done once for every ADB helper that imports oracledb from here
try {
    if (process.platform === 'win32') {
        oracledb.initOracleClient({ libDir: process.env.ORACLE_INSTANT_CLIENT_PATH });
    } else {
        // Linux logic: Use system-installed libraries
        oracledb.initOracleClient();
    }
} catch (err) {
    // Already initialized
}

export default oracledb;

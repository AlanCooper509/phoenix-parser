import { spawn } from "node:child_process";

async function postSyncUser(name, number, sid) {
    // ensures the sid is grabbing data for the expected user
    const validator = `${name}#${number}`;

    // run python script with the sid and validator args
    const pythonProcess = spawn('python', ["./python/piugame_parser.py", sid, validator]);
    return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('data', (data) => {
            // print statements aren't flushed, so it all comes back together
            resolve(data.toString());
        });
        pythonProcess.stderr.on('data', (data) => {
            reject(data.toString());
        });
    
    });
}

export default postSyncUser;
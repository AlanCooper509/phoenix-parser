import { spawn } from "node:child_process";

async function postSyncUser(sid, validator, outDir) {
    // ensures the sid is grabbing data for the expected user
    // run python script with the sid and validator args
    const pythonProcess = spawn('python', [
        "./python/piugame_parser.py",
        `sid=${sid}`, `user=${validator}`, `outDir=${outDir}`]);
    return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('data', (data) => {
            // print statements aren't flushed, so it all comes back together
            resolve(JSON.parse(data.toString()));
        });
        pythonProcess.stderr.on('data', (data) => {
            const errorObject = {
                error: {
                    code: 400,
                    message: data.toString()    
                }
            }
            reject(errorObject);
        });
    
    });
}

export default postSyncUser;
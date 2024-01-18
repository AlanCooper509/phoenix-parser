import { spawn } from "node:child_process";
import fs from 'fs';

function checkUpdatedToday(userDir) {
    if (fs.existsSync(`${userDir}/info.json`)) {
        const oldInfoFile = fs.readFileSync(`${userDir}/info.json`, "utf8");
        const oldInfo = JSON.parse(oldInfoFile);
        const dateArray = oldInfo.info.last_updated.split("/");
        const year = parseInt("20" + dateArray[2]);
        const month = parseInt(dateArray[0]) - 1;
        const date = parseInt(dateArray[1]);
        let d = new Date();

        return d.getDate() === date && d.getMonth() === month && d.getFullYear() === year;
    }
}

async function postSyncUser(sid, validator, userDir, outDir) {
    // check if user has been updated today already
    if (checkUpdatedToday(userDir)) {
        return new Promise((resolve, reject) => {
            const errorObject = {
                error: {
                    code: 429,
                    message: `The user has already been updated today! Try again tomorrow.`
                }
            }
            reject(errorObject);
        });
    }

    // run python script with the sid and validator args
    const pythonProcess = spawn('python', [
        "./python/piugame_parser.py",
        `sid=${sid}`, `user=${validator}`, `outDir=${outDir}`]);

    // promise for handling success/failure of Python script
    return new Promise((resolve, reject) => {
        // only one print statement is returned to resolve the promise
        // (it's not being flushed, so it all comes back together after script ends regardless)
        pythonProcess.stdout.on('data', (data) => {
            resolve(JSON.parse(data.toString()));
        });

        // any printing to sys.stderr sends back a 400 error (for now)
        pythonProcess.stderr.on('data', (data) => {
            const msg = data.toString()
            if (msg.startsWith("Traceback")) {
                reject({
                    error: {
                        code: 500,
                        message: "Internal Error... Please try again later."
                    }
                });
            }
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
import 'dotenv/config';

import fs from 'fs';
import { spawn } from "node:child_process";

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import renameObjectInObjectStorage from '../helpers/os_renameObject.js';
import uploadObjectToObjectStorage from '../helpers/os_uploadObject.js';
import saveDocument from '../helpers/adb_saveDocument.js';

function ERROR_400(msg) {
    return {
        error: {
            code: 400,
            message: msg
        }
    }
}
const ERROR_429 = {
    error: {
        code: 429,
        message: `This user was already updated recently! Try again later.`
    }
}
const ERROR_500 = {
    error: {
        code: 500,
        message: "Internal Error... Please try again later."
    }
}
const FILELIST = [
    process.env.INFO_FILENAME,
    process.env.BEST_SCORES_FILENAME,
    process.env.PUMBILITY_FILENAME,
    process.env.RECENTS_FILENAME,
    process.env.TITLES_FILENAME
];

async function syncUser(sid, name, number) {
    const dirname = fs.realpathSync('.');
    const user = getUserID(name, number);
    const outDir = `${dirname}/tmp/${user}`;
    const scoresFile = `${dirname}/tmp/${user}/old_best_scores.json`;
    let pythonArgs = [process.env.PYTHON_SCRIPT,
        `sid=${sid}`, `user=${user}`, `outDir=${outDir}`
    ];

    // grab Object Storage copy of user's info file from most recent previous sync
    const infoFileName = `${process.env.USERS_DIR}/${user}/${process.env.INFO_FILENAME}`;
    const infoObject = await readJsonFromObjectStorage(infoFileName);

    // pass in the language used during previous sync
    if (!infoObject.error) {
        pythonArgs.push(`language=${infoObject.info.language}`);
    }

    // check if user has been updated today already
    let dateObject = '';
    try {
        dateObject = await getLastSyncDate(infoObject, 8*60*60);
    } catch (error) {
        return error;
    }
    if (dateObject.exists && dateObject.updatedRecently) {
        return ERROR_429;
    }

    // ensure outDir is clean before starting test
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir);

    // check if Object Storage has a history for the user's Best Scores that can be passed to Python script
    // (goal of reducing requests needed to make to piugame server)
    const scoresFileName = `${process.env.USERS_DIR}/${getUserID(name, number)}/${process.env.BEST_SCORES_FILENAME}`;
    let scores = await readJsonFromObjectStorage(scoresFileName);
    if (!scores.error) {
        fs.writeFileSync(scoresFile, JSON.stringify(scores));
        pythonArgs.push(`cmpFile=${scoresFile}`);
    }

    return new Promise((resolve, reject) => {
        let data = {};

        const pythonProcess = spawn('python', pythonArgs);
        console.log(`Starting sync for ${user}`);
        pythonPromise(pythonProcess).then((output) => {
            console.log(`Successful sync for ${user}`);
            data = output;
            return archiveOldFiles(user, dateObject);
        }).then(() => {
            writeNewFiles(user, outDir);
            saveDocument("info_collection", data, user);
        }).then(() => {
            resolve({
                info: data.info,
                titles: data.titles.count,
                scores: data.scores.count,
                pumbility: data.pumbility.value
            });
        }).catch((error) => {
            // resolve it so the 400 error gets sent back to user
            resolve(error);
        });
    });
}

async function getLastSyncDate(infoObject, timeoutSeconds) {
    if (infoObject.error) {

        if (infoObject.error.code === 404) {
            // not updated today if file cannot be found
            return {
                exists: false
            };
        } else {
            throw infoObject;
        }
    }
    // used for updatedRecently
    const timestamp = infoObject.info.timestamp;

    // last_updated is formatted as mm/dd/yy, change it to match JS Date() helpers
    const dateArray = infoObject.info.last_updated.split("/");
    const year = parseInt("20" + dateArray[2]);
    const month = parseInt(dateArray[0]) - 1;
    const date = parseInt(dateArray[1]);

    return {
        exists: true,
        updatedRecently: (Date.now()/1000 - timeoutSeconds) < timestamp,
        date: {
            string: `${dateArray[2]}-${dateArray[0]}-${dateArray[1]}`,
            year: dateArray[2],
            month: dateArray[0],
            day: dateArray[1]
        }
    };
}

function pythonPromise(pythonProcess) {
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
                console.log(msg);
                reject(ERROR_500);
            }
            reject(ERROR_400(data.toString()));
        });
    });
}

async function archiveOldFiles(user, dateObject) {
    if (!dateObject.exists) return;
    for await (const file of FILELIST) {
        const filePath = `${process.env.USERS_DIR}/${user}/${file}`;
        const filePathDated = `${process.env.USERS_DIR}/${user}/${dateObject.date.string}/${file}`;
        const testObject = await readJsonFromObjectStorage(filePath);
        if (!("error" in testObject)) {
            await renameObjectInObjectStorage(filePath, filePathDated);
        }
    }
    return;
}

async function writeNewFiles(user, outDir) {
    for await (const file of FILELIST) {
        const uploadFilePath = `${outDir}/${file}`;

        const maxRetries = 5;
        let timeout;
        for(timeout = 0; !fs.existsSync(uploadFilePath); timeout++) {
            if (timeout == maxRetries) { break; }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (timeout == maxRetries) { 
            console.log(`FILE ${uploadFilePath} NOT FOUND`);
            continue;
        }
        const uploadFile = fs.createReadStream(uploadFilePath, {encoding: 'utf8'});
        const objectName = `${process.env.USERS_DIR}/${user}/${file}`;
        uploadObjectToObjectStorage(objectName, uploadFile);
    }
    return;
}

export default syncUser;
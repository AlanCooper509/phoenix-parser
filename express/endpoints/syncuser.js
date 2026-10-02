import 'dotenv/config';

import fs from 'fs';
import path from 'path';
import { spawn } from "node:child_process";

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import renameObjectInObjectStorage from '../helpers/os_renameObject.js';
import uploadObjectToObjectStorage from '../helpers/os_uploadObject.js';
import saveDocument from '../helpers/adb_saveDocument.js';
import { buildUserResponse } from './user.js';

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
const ERROR_409 = {
    error: {
        code: 409,
        message: `A sync for this user is already in progress. Please wait for it to finish.`
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

// "<game>/<NAME#NUM>" of syncs currently running, so a double submit can't run two at once
const syncsInProgress = new Set();

async function syncUser(sid, name, number, game) {
    const user = getUserID(name, number);
    const syncKey = `${game.id}/${user}`;
    if (syncsInProgress.has(syncKey)) {
        return ERROR_409;
    }
    syncsInProgress.add(syncKey);

    // per-game scratch folder, removed afterwards (it only holds copies of what gets uploaded)
    const outDir = path.join(fs.realpathSync('.'), 'tmp', game.id, user);
    try {
        return await runSync(sid, user, game, outDir);
    } finally {
        syncsInProgress.delete(syncKey);
        fs.rmSync(outDir, { recursive: true, force: true });
    }
}

async function runSync(sid, user, game, outDir) {
    const userDir = `${game.usersDir}/${user}`;
    const scoresFile = path.join(outDir, 'old_best_scores.json');
    let pythonArgs = [game.syncScript,
        `sid=${sid}`, `user=${user}`, `outDir=${outDir}`
    ];

    // grab Object Storage copy of user's info file from most recent previous sync
    const infoObject = await readJsonFromObjectStorage(`${userDir}/${process.env.INFO_FILENAME}`);

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

    // start from an empty scratch folder
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    // check if Object Storage has a history for the user's Best Scores that can be passed to Python script
    // (goal of reducing requests needed to make to piugame server)
    const scores = await readJsonFromObjectStorage(`${userDir}/${process.env.BEST_SCORES_FILENAME}`);
    if (!scores.error) {
        fs.writeFileSync(scoresFile, JSON.stringify(scores));
        pythonArgs.push(`cmpFile=${scoresFile}`);
    }

    let data;
    try {
        console.log(`Starting sync for ${user}`);
        const pythonProcess = spawn('python', pythonArgs);
        data = await pythonPromise(pythonProcess);
        console.log(`Successful sync for ${user}`);
    } catch (error) {
        // If pythonPromise fails with ERROR_400 or ERROR_500
        return error;
    }

    const uploaded = await replaceUserFiles(game, user, outDir, dateObject);
    if (!uploaded.includes(process.env.INFO_FILENAME) || !uploaded.includes(process.env.BEST_SCORES_FILENAME)) {
        return ERROR_500;
    }
    await saveDocument(game.usersCollection, data, user);

    return {
        info: data.info,
        titles: data.titles.count,
        scores: data.scores.count,
        pumbility: data.pumbility.value,
        // same shape as GET /user, so the page can update without reloading
        user: await buildUserResponse(game, readLocalUserFiles(outDir))
    };
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
        // collect all output and decide once the script exits: stdout can arrive in
        // several chunks, and stderr may carry warnings alongside a successful result
        let stdout = '';
        let stderr = '';
        pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

        pythonProcess.on('error', (error) => {
            console.log(`Failed to start sync script: ${error}`);
            reject(ERROR_500);
        });

        pythonProcess.on('close', () => {
            // success: the script prints its JSON result to stdout
            if (stdout.trim()) {
                try {
                    resolve(JSON.parse(stdout));
                    return;
                } catch (error) {
                    console.log(`Unparseable sync output: ${error}\n${stdout.slice(0, 500)}`);
                    reject(ERROR_500);
                    return;
                }
            }
            // crash: log it, but don't show the traceback to the user
            if (stderr.includes("Traceback")) {
                console.log(stderr);
                reject(ERROR_500);
                return;
            }
            // expected failures (e.g. expired SID) are printed to stderr for the user
            if (stderr.trim()) {
                reject(ERROR_400(stderr.trim()));
                return;
            }
            reject(ERROR_500);
        });
    });
}

// Swap in each freshly scraped file: the current copy moves to the previous sync's dated
// folder, then the new one is uploaded (moving the old copy back if that fails).
// Files the scraper didn't produce are left as they are. Returns the uploaded file names.
async function replaceUserFiles(game, user, outDir, dateObject) {
    const uploaded = [];
    for (const file of FILELIST) {
        const localFile = path.join(outDir, file);
        if (!fs.existsSync(localFile)) {
            console.log(`Sync for ${user} produced no ${file}; keeping the current one`);
            continue;
        }

        const currentName = `${game.usersDir}/${user}/${file}`;
        let archivedName = null;
        if (dateObject.exists) {
            const datedName = `${game.usersDir}/${user}/${dateObject.date.string}/${file}`;
            const archived = await renameObjectInObjectStorage(currentName, datedName);
            if (!archived.error) {
                archivedName = datedName;
            } else if (archived.error.code !== 404) {
                console.error(`Failed to archive ${file} for ${user} (${archived.error.code})`);
            }
        }

        const result = await uploadObjectToObjectStorage(currentName, fs.createReadStream(localFile, {encoding: 'utf8'}));
        if (result.error) {
            console.error(`Failed to upload ${file} for ${user} (${result.error.code})`);
            if (archivedName) {
                await renameObjectInObjectStorage(archivedName, currentName);
            }
            continue;
        }
        uploaded.push(file);
    }
    return uploaded;
}

// the scraped files in the same shape readJsonFromObjectStorage returns them
function readLocalUserFiles(outDir) {
    const read = (file) => {
        try {
            return JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8'));
        } catch (error) {
            return { error: { code: 404 } };
        }
    };
    return {
        info: read(process.env.INFO_FILENAME),
        scores: read(process.env.BEST_SCORES_FILENAME),
        titles: read(process.env.TITLES_FILENAME),
        pumbility: read(process.env.PUMBILITY_FILENAME),
    };
}

export default syncUser;
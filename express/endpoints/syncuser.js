import fs from 'fs';
import path from 'path';

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import renameObjectInObjectStorage from '../helpers/os_renameObject.js';
import uploadObjectToObjectStorage from '../helpers/os_uploadObject.js';
import USER_FILES from '../helpers/userFiles.js';
import { ERROR_400, ERROR_500 } from '../helpers/syncErrors.js';

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
const FILELIST = Object.values(USER_FILES);

// "<game>/<NAME#NUM>" of syncs currently running, so a double submit can't run two at once
const syncsInProgress = new Set();

async function syncUser(sid, name, number, game) {
    const user = getUserID(name, number);
    const result = await startSync(sid, user, game);
    // every failure gets a line (successes and server errors log their own details);
    // the messages never include the SID
    if (result.error) {
        console.log(`Failed ${game.id} sync for ${user} (${result.error.code}): ${result.error.message}`);
    }
    return result;
}

async function startSync(sid, user, game) {
    // PHP session ids: it gets sent on as a cookie, so nothing else gets through
    if (typeof sid !== 'string' || !/^[A-Za-z0-9,-]{1,128}$/.test(sid)) {
        return ERROR_400("Please enter a valid SID.");
    }

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

    // grab Object Storage copy of user's info file from most recent previous sync
    const infoObject = await readJsonFromObjectStorage(`${userDir}/${USER_FILES.info}`);

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

    // the game's scraper writes the user's files into outDir and resolves to a summary
    let summary;
    try {
        console.log(`Starting ${game.id} sync for ${user}`);
        summary = await game.scrape({ sid, user, userDir, outDir, info: infoObject });
        console.log(`Successful ${game.id} sync for ${user}`);
    } catch (error) {
        // scrapers reject with { error } (ERROR_400, ERROR_500, ...)
        if (error && error.error) {
            return error;
        }
        console.log(`Sync failed for ${user}: ${error}`);
        return ERROR_500;
    }

    const uploaded = await replaceUserFiles(game, user, outDir, dateObject);
    if (!uploaded.includes(USER_FILES.info) || !uploaded.includes(USER_FILES.scores)) {
        return ERROR_500;
    }
    // the user's files are in place, so a failed listing update (home page, search) doesn't fail the sync
    try {
        await game.saveListing(user, summary);
    } catch (error) {
        console.log(`Failed to update the ${game.id} user listing for ${user}: ${error}`);
    }

    return {
        info: summary.info,
        titles: summary.titles.count,
        scores: summary.scores.count,
        pumbility: summary.pumbility.value,
        // same shape as GET /user, so the page can update without reloading
        user: await game.buildUser(readLocalUserFiles(outDir, game))
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

// the scraped files for GET /user, in the same shape readJsonFromObjectStorage returns them
function readLocalUserFiles(outDir, game) {
    const read = (file) => {
        try {
            return JSON.parse(fs.readFileSync(path.join(outDir, file), 'utf8'));
        } catch (error) {
            return { error: { code: 404 } };
        }
    };
    return Object.fromEntries(game.userFiles.map((key) => [key, read(USER_FILES[key])]));
}

export default syncUser;
import 'dotenv/config';

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import sortScores from '../helpers/sortScores.js';

async function getUser(req) {
    const name = req.params.name.toUpperCase();
    const number = req.params.number;
    const userId = getUserID(name, number);
    const userDir = `${process.env.USERS_DIR}/${userId}`;

    const infoPromise = readJsonFromObjectStorage(`${userDir}/${process.env.INFO_FILENAME}`);
    const scoresPromise = readJsonFromObjectStorage(`${userDir}/${process.env.BEST_SCORES_FILENAME}`);
    const titlesPromise = readJsonFromObjectStorage(`${userDir}/${process.env.TITLES_FILENAME}`);
    const pumbilityPromise = readJsonFromObjectStorage(`${userDir}/${process.env.PUMBILITY_FILENAME}`);

    // Wait for all of them to finish at the same time
    // (recents.json is still synced but isn't read here: the frontend doesn't use it)
    let [info, scores, titles, pumbility] = await Promise.all([
        infoPromise,
        scoresPromise,
        titlesPromise,
        pumbilityPromise
    ]);

    // Info validation (Critical)
    if (info.error) {
        if (info.error.code === 404) {
            info.error.message = "User's INFO could not be found!";
        }
        return info;
    }

    // Scores validation & processing (Critical)
    if (scores.error) {
        if (scores.error.code === 404) {
            scores.error.message = "User's BEST_SCORES could not be found!";
        }
        return scores;
    }
    const sortedScores = await sortScores(scores);
    if (sortedScores.error) {
        return sortedScores;
    }

    // Titles fallback (Optional/Migrated)
    if (titles.error) {
        if (titles.error.code === 404) {
            titles = info.titles;
        }
    }

    // Pumbility fallback (Optional)
    if (pumbility.error) {
        if (pumbility.error.code === 404) {
            pumbility = [];
        }
    }

    return {
        "scores": sortedScores,
        "info": info.info,
        "titles": titles,
        "pumbility": pumbility
    };
}

export default getUser;
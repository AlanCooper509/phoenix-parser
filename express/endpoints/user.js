import 'dotenv/config';

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import sortScores from '../helpers/sortScores.js';

async function getUser(req) {
    const name = req.params.name.toUpperCase();
    const number = req.params.number;

    // attempt to find USER#NUMBER's latest INFO_FILENAME
    const infoFileName = `${process.env.USERS_DIR}/${getUserID(name, number)}/${process.env.INFO_FILENAME}`;
    let info = await readJsonFromObjectStorage(infoFileName);
    if (info.error) {
        if (info.error.code === 404) {
            info.error.message = "User's INFO could not be found!";
        }
        return info;
    }

    // attempt to find USER#NUMBER's latest BEST_SCORES_FILENAME
    const scoresFileName = `${process.env.USERS_DIR}/${getUserID(name, number)}/${process.env.BEST_SCORES_FILENAME}`;
    let scores = await readJsonFromObjectStorage(scoresFileName);
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

    const titlesFileName = `${process.env.USERS_DIR}/${getUserID(name, number)}/${process.env.TITLES_FILENAME}`;
    let titles = await readJsonFromObjectStorage(titlesFileName);
    if (titles.error) {
        if (titles.error.code === 404) {
            // titles were migrated from info.titles into its own separate JSON file
            titles = info.titles;
        }
    }
    const pumbilityFileName = `${process.env.USERS_DIR}/${getUserID(name, number)}/${process.env.PUMBILITY_FILENAME}`;
    let pumbility = await readJsonFromObjectStorage(pumbilityFileName);
    if (pumbility.error) {
        if (pumbility.error.code === 404) {
            // pumbility file is optional; was only collected later on during syncs
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
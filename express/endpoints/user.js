import 'dotenv/config';

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import sortScores from '../helpers/sortScores.js';

async function getUser(req, game) {
    const name = req.params.name.toUpperCase();
    const number = req.params.number;
    const userId = getUserID(name, number);
    const userDir = `${game.usersDir}/${userId}`;

    const infoPromise = readJsonFromObjectStorage(`${userDir}/${process.env.INFO_FILENAME}`);
    const scoresPromise = readJsonFromObjectStorage(`${userDir}/${process.env.BEST_SCORES_FILENAME}`);
    const titlesPromise = readJsonFromObjectStorage(`${userDir}/${process.env.TITLES_FILENAME}`);
    const pumbilityPromise = readJsonFromObjectStorage(`${userDir}/${process.env.PUMBILITY_FILENAME}`);

    // Wait for all of them to finish at the same time
    // (recents.json is still synced but isn't read here: the frontend doesn't use it)
    const [info, scores, titles, pumbility] = await Promise.all([
        infoPromise,
        scoresPromise,
        titlesPromise,
        pumbilityPromise
    ]);

    return buildUserResponse(game, { info, scores, titles, pumbility });
}

// Shapes a user's synced files into the API response (shared with /sync, which builds it
// from the freshly scraped files). Each file is its JSON content or { error: { code } }.
export async function buildUserResponse(game, { info, scores, titles, pumbility }) {
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
    const sortedScores = await sortScores(scores, game);
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
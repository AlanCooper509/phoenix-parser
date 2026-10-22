import 'dotenv/config';

// a user's synced files, stored under <game.usersDir>/<NAME#NUM>/ (same file names in every game)
const USER_FILES = {
    info: process.env.INFO_FILENAME,
    scores: process.env.BEST_SCORES_FILENAME,
    titles: process.env.TITLES_FILENAME,
    pumbility: process.env.PUMBILITY_FILENAME,
    recents: process.env.RECENTS_FILENAME
};

// Info and best scores are required for a user page: returns their error (with a message), or null.
// Each file is its JSON content or { error: { code } }.
export function missingRequiredFile({ info, scores }) {
    if (info.error) {
        if (info.error.code === 404) {
            info.error.message = "User's INFO could not be found!";
        }
        return info;
    }
    if (scores.error) {
        if (scores.error.code === 404) {
            scores.error.message = "User's BEST_SCORES could not be found!";
        }
        return scores;
    }
    return null;
}

export default USER_FILES;

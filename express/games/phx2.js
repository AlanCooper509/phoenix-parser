import 'dotenv/config';

import scrapeWithModule from '../helpers/scrape_module.js';
import { listIndexedUsers, updateIndexedUser } from '../helpers/os_usersIndex.js';
import { missingRequiredFile } from '../helpers/userFiles.js';

// Pump It Up PHOENIX 2: where its data lives (separate from Phoenix (1)'s) and how it syncs
const phx2 = {
    id: "phx2",

    // private bucket: express-build/phx2/users/<NAME#NUM>/, plus index.json listing every user
    usersDir: "express-build/phx2/users",
    // public piu-assets bucket
    chartsDir: "phx2/charts",

    // files returned by GET /user
    userFiles: ["info", "scores", "titles", "pumbility", "recents"],

    // /sync: scraper of piugame.com, kept out of the repo (see helpers/scrape_module.js)
    scrape: (options) => scrapeWithModule(process.env.PHX2_SCRAPER, options),
    saveListing: (user, summary) => updateIndexedUser(phx2, user, { info: summary.info }),
    listUsers: (name) => listIndexedUsers(phx2, name),
    buildUser,
};

// Shapes a user's synced files into the GET /user response (also returned by /sync).
// PUMBILITY is scraped as piugame.com calculates it, so scores are passed through as synced.
async function buildUser({ info, scores, titles, pumbility, recents }) {
    const missing = missingRequiredFile({ info, scores });
    if (missing) {
        return missing;
    }
    return {
        info: info.info,
        scores,
        titles: titles.error ? [] : titles,
        pumbility: pumbility.error ? null : pumbility,
        recents: recents.error ? [] : recents
    };
}

export default phx2;

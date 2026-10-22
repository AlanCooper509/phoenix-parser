import 'dotenv/config';

import { listIndexedUsers, updateIndexedUser } from '../helpers/os_usersIndex.js';
import scrapeWithPython from '../helpers/scrape_python.js';
import sortScores from '../helpers/sortScores.js';
import { missingRequiredFile } from '../helpers/userFiles.js';

// Pump It Up PHOENIX (1): where its data lives and how its ratings are scored
const phx1 = {
    id: "phx1",

    // private bucket: express-build/users/<NAME#NUM>/ (kept at its original, pre-split location),
    // plus index.json listing every user
    usersDir: process.env.USERS_DIR,
    // public piu-assets bucket
    chartsDir: "phx1/charts",
    // files returned by GET /user (recents.json is still synced but the frontend doesn't use it)
    userFiles: ["info", "scores", "titles", "pumbility"],

    // /sync: Python scraper of phoenix.piugame.com, which also checks the SID is the page's user
    scrape: (options) => scrapeWithPython(process.env.PYTHON_SCRIPT, options),
    saveListing: (user, summary) => updateIndexedUser(phx1, user, { info: summary.info }),
    listUsers: (name) => listIndexedUsers(phx1, name),
    buildUser,

    gradeMultipliers: {
        "f":     0.40,
        "d":     0.50,
        "c":     0.60,
        "b":     0.70,
        "a":     0.80,
        "a_p":   0.90,
        "aa":    1.00,
        "aa_p":  1.05,
        "aaa":   1.10,
        "aaa_p": 1.15,
        "s":     1.20,
        "s_p":   1.26,
        "ss":    1.32,
        "ss_p":  1.38,
        "sss":   1.44,
        "sss_p": 1.50
    },

    levelMultipliers: {
        "10": 100,
        "11": 110,
        "12": 130,
        "13": 160,
        "14": 200,
        "15": 250,
        "16": 310,
        "17": 380,
        "18": 460,
        "19": 550,
        "20": 650,
        "21": 760,
        "22": 880,
        "23": 1010,
        "24": 1150,
        "25": 1300,
        "26": 1460,
        "27": 1630,
        "28": 1810,
        "29": 2000,
        "coop": 2200
    },
};

// Shapes a user's synced files into the GET /user response (also returned by /sync).
// Each file is its JSON content or { error: { code } }.
async function buildUser({ info, scores, titles, pumbility }) {
    const missing = missingRequiredFile({ info, scores });
    if (missing) {
        return missing;
    }
    const sortedScores = await sortScores(scores, phx1);
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

export default phx1;

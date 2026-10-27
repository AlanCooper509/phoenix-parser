import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import getUserID from './getUserID.js';
import readJsonFromObjectStorage from './os_readJsonObject.js';
import USER_FILES from './userFiles.js';
import { ERROR_400, ERROR_500, ERROR_503 } from './syncErrors.js';

// Scrapers kept out of the repo (e.g. the gitignored ./scrapers/ folder), loaded by file path.
// A scraper module's default export is:
//   async scrape(sid, previous) -> {
//     profile:   { player, number (digits only), userNo, title: { text, color }, avatar, language },
//     scores:    [{ name, jacket, type, level, score, stageBreak, grade, plate, firstPlayed }],
//     pumbility: { tier, icon (piugame's pumbility_NN.png number), value, entries: [...] },
//     ranking:   { all, singles, doubles } (the player's PUMBILITY ranking places: a number, or what the
//                ranking page shows instead past its top 1,000; null if nothing),
//     titles:    [name],
//     recents:   [...],
//     stats:     { ... }  (logged)
//   }
// where previous is { scores, syncedAt (seconds) } from the user's last sync (or null),
// and throws an Error with a `userMessage` for problems the user can fix (e.g. an expired SID).
const scrapers = new Map(); // file -> Promise<scrape function or null>

function loadScraper(file) {
    if (!scrapers.has(file)) {
        const loaded = file
            ? import(pathToFileURL(path.resolve(file)).href)
                .then((module) => module.default)
                .catch((error) => {
                    console.log(`Unable to load scraper ${file}: ${error}`);
                    scrapers.delete(file);  // retry on the next sync
                    return null;
                })
            : Promise.resolve(null);
        scrapers.set(file, loaded);
    }
    return scrapers.get(file);
}

// Runs the scraper at `file` and writes the user's files into outDir.
// Resolves to a summary of the sync, or rejects with { error }.
async function scrapeWithModule(file, { sid, user, userDir, outDir, info: previousInfo }) {
    const scrape = await loadScraper(file);
    if (!scrape) {
        throw ERROR_503;
    }

    // the last sync's best scores, so the scraper only has to fetch what changed since
    let previous = null;
    if (!previousInfo.error) {
        const scores = await readJsonFromObjectStorage(`${userDir}/${USER_FILES.scores}`);
        if (!scores.error) {
            previous = { scores, syncedAt: previousInfo.info.timestamp };
        }
    }

    let data;
    try {
        data = await scrape(sid, previous);
    } catch (error) {
        if (error.userMessage) {
            throw ERROR_400(error.userMessage);
        }
        console.log(`Scraper failed for ${user}: ${error.stack || error}`);
        throw ERROR_500;
    }

    // only the SID's own player can be synced to this user's page
    const { profile, scores, pumbility, ranking, titles, recents, stats } = data;
    console.log(`Scraped ${user}: ${JSON.stringify(stats)}`);
    const scrapedUser = getUserID(profile.player, profile.number).toUpperCase();
    if (scrapedUser !== user.toUpperCase()) {
        throw ERROR_400(`This SID belongs to ${scrapedUser}, not ${user}. Please sync from your own page.`);
    }

    const now = new Date();
    const info = {
        info: {
            player: profile.player,
            number: `#${profile.number}`,
            userNo: profile.userNo,
            title: profile.title,
            avatar: profile.avatar,
            language: profile.language,
            pumbility: { tier: pumbility.tier, icon: pumbility.icon, value: pumbility.value },
            ranking: ranking || null,
            // same formats as Phoenix (1): mm/dd/yy, and seconds since epoch
            last_updated: `${pad(now.getMonth() + 1)}/${pad(now.getDate())}/${pad(now.getFullYear() % 100)}`,
            timestamp: now.getTime() / 1000
        }
    };

    const write = (file, content) => fs.writeFileSync(path.join(outDir, file), JSON.stringify(content));
    write(USER_FILES.info, info);
    write(USER_FILES.scores, scores);
    write(USER_FILES.pumbility, pumbility);
    write(USER_FILES.titles, titles);
    write(USER_FILES.recents, recents);

    return {
        info: info.info,
        titles: { count: titles.length },
        scores: { count: scores.length },
        pumbility: { value: pumbility.value }
    };
}

function pad(n) {
    return String(n).padStart(2, '0');
}

export default scrapeWithModule;

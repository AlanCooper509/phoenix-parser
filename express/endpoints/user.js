import 'dotenv/config';

import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import getChartStats from './chartstats.js';

const gradeMultipliers = {
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
}

const levelMultipliers = {
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
    "coop": 2200
}

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

    // attempt retrieval of LEVEL_COUNTS from Object Storage
    let chartStats = await getChartStats();
    if (chartStats.error) {
        return chartStats;
    }

    const sortedByLevel = splitByLevelandCalculateRating(scores);
    const sortedScores = getStatistics(sortedByLevel, chartStats);

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

function splitByLevelandCalculateRating(jsonArray) {
    // already iterating through all entries, just add Rating field to each
    let levels = {};
    for (const idx in jsonArray) {
        let entry = jsonArray[idx];
        const level = entry["level"];

        // add rating field to entry
        let rating = 0;
        if (entry["type"] !== 'c' && parseInt(level) >= 10) {
            rating = Math.round(gradeMultipliers[entry["grade"]]*levelMultipliers[level]);
        } else if (entry["type"] === 'c') {
            rating = Math.round(gradeMultipliers[entry["grade"]]*levelMultipliers["coop"]);
        }
        entry["rating"] = rating;

        if (!levels[level]) {
            levels[level] = {scores: []};
        }
        levels[level]["scores"].push(entry);
    }
    return levels;
}

function getStatistics(levelsData, levelCounts) {
    for (const level in levelsData) {
        let singlesCount = 0, doublesCount = 0;
        let averageScore = 0, doublesScore = 0, singlesScore = 0;
        let totalRating = 0, singlesRating = 0, doublesRating = 0;
        const entriesForLevel = levelsData[level]["scores"];
        for (const idx in entriesForLevel) {
            let entry = entriesForLevel[idx];
            let scoreEntry = parseInt(entry["score"].replace(/,/g, ''));
            averageScore += scoreEntry;
            totalRating += entry.rating;

            switch (entry["type"]) {
                case 's':
                    singlesCount += 1;
                    singlesScore += scoreEntry;
                    if (parseInt(level) >= 10) {
                        singlesRating += entry.rating;
                    }
                    break;
                case 'd':
                    doublesCount += 1;
                    doublesScore += scoreEntry;
                    if (parseInt(level) >= 10) {
                        doublesRating += entry.rating;
                    }
                    break;
                default:
                    break;
            }
        }
        averageScore /= entriesForLevel.length;
        singlesScore /= singlesCount;
        doublesScore /= doublesCount;

        levelsData[level]["average"] = Math.round(averageScore);
        levelsData[level]["count"] = entriesForLevel.length;
        levelsData[level]["rating"] = totalRating;
        if (isNaN(parseInt(level))) {
            // co-op charts are difficulty "n<x>" where x is num of players
            continue;
        }
        let totalClearPct   = levelCounts[level][ "total" ] !== 0 ? (entriesForLevel.length / levelCounts[level][ "total" ]).toFixed(4) : 0.00;
        let singlesClearPct = levelCounts[level]["singles"] !== 0 ?           (singlesCount / levelCounts[level]["singles"]).toFixed(4) : 0.00;
        let doublesClearPct = levelCounts[level]["doubles"] !== 0 ?           (doublesCount / levelCounts[level]["doubles"]).toFixed(4) : 0.00;
        levelsData[level]["clear"] = totalClearPct;
        levelsData[level]["singles"] = {"average": Math.round(singlesScore), "count": singlesCount, "clear": singlesClearPct, "rating": singlesRating};
        levelsData[level]["doubles"] = {"average": Math.round(doublesScore), "count": doublesCount, "clear": doublesClearPct, "rating": doublesRating};
    }
    return levelsData;
}

export default getUser;
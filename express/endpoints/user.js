import levelCounts from '../charts/v1_05_0/levelCounts.json' assert { type: "json" };
import levelMultipliers from '../constants/levelMultipliers.json' assert { type: "json" };
import gradeMultipliers from '../constants/gradeMultipliers.json' assert { type: "json" };

import fs from 'fs';

function getUser(req) {
    const name = req.params.name.toUpperCase();
    const number = req.params.number;
    const userDir = `./users/${getUserID(name, number)}/`;

    // attempt to load the scores JSON for the requested user
    let scoresfile, scores;
    try {
        scoresfile = fs.readFileSync(`${userDir}/scores.json`, "utf8");
        scores = JSON.parse(scoresfile);
    } catch (error) {
        return {
            "error": {
                "code": 404,
                "message": "User Not Found!"
            }
        }
    }

    const infoFile = fs.readFileSync(`${userDir}/info.json`, "utf8");
    const info = JSON.parse(infoFile);

    const sortedByLevel = splitByLevel(scores);
    const sortedScores = getStatistics(sortedByLevel);

    return {
        "scores": sortedScores,
        "info": info.info,
        "titles": info.titles
    };
}

function getUserID(name, number) {
    return `${name}#${number}`;
}

function splitByLevel(jsonArray) {
    let levels = {};
    for (const idx in jsonArray) {
        let entry = jsonArray[idx];
        if (!levels[entry["level"]]) {
            levels[entry["level"]] = {scores: []};
        }
        levels[entry["level"]]["scores"].push(entry);
    }
    return levels;
}

function getStatistics(levelsData) {
    for (const level in levelsData) {
        let singlesCount = 0, doublesCount = 0;
        let averageScore = 0, doublesScore = 0, singlesScore = 0;
        let totalRating = 0, singlesRating = 0, doublesRating = 0;
        const entriesForLevel = levelsData[level]["scores"];
        for (const idx in entriesForLevel) {
            let entry = entriesForLevel[idx];
            let scoreEntry = parseInt(entry["score"].replace(/,/g, ''));
            averageScore += scoreEntry;
            if (entry["type"] !== 'c' && parseInt(level) >= 10) {
                totalRating += Math.round(gradeMultipliers[entry["grade"]]*levelMultipliers[level]);
            }

            switch (entry["type"]) {
                case 's':
                    singlesCount += 1;
                    singlesScore += scoreEntry;
                    if (parseInt(level) >= 10) {
                        singlesRating += Math.round(gradeMultipliers[entry["grade"]]*levelMultipliers[level]);
                    }
                    break;
                case 'd':
                    doublesCount += 1;
                    doublesScore += scoreEntry;
                    if (parseInt(level) >= 10) {
                        doublesRating += Math.round(gradeMultipliers[entry["grade"]]*levelMultipliers[level]);
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
import info from './info.json';
import input from './input.json';
import levelCounts from './levelCounts.json'

const initData = function initalizeData() {
    function categorizeByLevel(jsonArray) {
        let levels = {};
        for (const idx in jsonArray) {
            let entry = jsonArray[idx];
            if (!levels[entry["level"]]) {
                levels[entry["level"]] = [];
            }
            levels[entry["level"]].push(entry);
        }
        return levels;
    }
    function getStatistics(levelsData) {
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
            "28": 1810
        }
        for (const level in levelsData) {
            let singlesCount = 0, doublesCount = 0;
            let averageScore = 0, doublesScore = 0, singlesScore = 0;
            let totalRating = 0, singlesRating = 0, doublesRating = 0;
            const entriesForLevel = levelsData[level];
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
    let sortedByLevel = categorizeByLevel(input);
    let data = getStatistics(sortedByLevel);
    return {info, data};
}

export default initData;
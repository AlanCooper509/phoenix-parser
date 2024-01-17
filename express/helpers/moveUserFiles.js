import fs from 'fs';

function moveUserFiles(userDir, tmpDir) {
    const files = ["info.json", "best_scores.json", "best_scores.tsv", "best_scores.csv"];
    try {
        // move pre-existing data to dated folder
        const oldInfoFile = fs.readFileSync(`${userDir}/info.json`, "utf8");
        const oldInfo = JSON.parse(oldInfoFile);

        // convert from mm/dd/yy to yy-mm-dd
        const date = oldInfo.info.last_updated;
        const yearMonthDay = `${date.split("/")[2]}-${date.split("/")[0]}-${date.split("/")[1]}`;
        const datedFolder = `${userDir}/${yearMonthDay}`;
        if (!fs.existsSync(datedFolder)) { fs.mkdirSync(datedFolder); }

        for (const idx in files) {
            const filename = files[idx];

            // place old data from user folder into dated folder
            fs.renameSync(`${userDir}/${filename}`, `${datedFolder}/${filename}`, (err) => {
                if (err) throw err;
            });
        }

    } catch (error) {
        console.log(error);
        // no pre-existing data, carry on...
    }

    for (const idx in files) {
        const filename = files[idx];

        // place new data from tmp folder into user folder
        try {
            fs.renameSync(`${tmpDir}/${filename}`, `${userDir}/${filename}`, (err) => {
                if (err) throw err;
            });    
        } catch (error) {
            console.log(error);
        }
    }

    fs.rmSync(tmpDir, { recursive: true, force: true });
}

export default moveUserFiles;
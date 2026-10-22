import fs from 'fs';
import path from 'path';
import { spawn } from "node:child_process";

import readJsonFromObjectStorage from './os_readJsonObject.js';
import USER_FILES from './userFiles.js';
import { ERROR_400, ERROR_500 } from './syncErrors.js';

// Runs a Python scraper (Phoenix (1)), which writes the user's files into outDir and prints a
// JSON summary to stdout. Resolves to that summary, or rejects with { error }.
async function scrapeWithPython(script, { sid, user, userDir, outDir, info }) {
    let pythonArgs = [script,
        `sid=${sid}`, `user=${user}`, `outDir=${outDir}`
    ];

    // pass in the language used during previous sync
    if (!info.error) {
        pythonArgs.push(`language=${info.info.language}`);
    }

    // check if Object Storage has a history for the user's Best Scores that can be passed to Python script
    // (goal of reducing requests needed to make to piugame server)
    const scores = await readJsonFromObjectStorage(`${userDir}/${USER_FILES.scores}`);
    if (!scores.error) {
        const scoresFile = path.join(outDir, 'old_best_scores.json');
        fs.writeFileSync(scoresFile, JSON.stringify(scores));
        pythonArgs.push(`cmpFile=${scoresFile}`);
    }

    return await pythonPromise(spawn('python', pythonArgs));
}

function pythonPromise(pythonProcess) {
    return new Promise((resolve, reject) => {
        // collect all output and decide once the script exits: stdout can arrive in
        // several chunks, and stderr may carry warnings alongside a successful result
        let stdout = '';
        let stderr = '';
        pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

        pythonProcess.on('error', (error) => {
            console.log(`Failed to start sync script: ${error}`);
            reject(ERROR_500);
        });

        pythonProcess.on('close', () => {
            // success: the script prints its JSON result to stdout
            if (stdout.trim()) {
                try {
                    resolve(JSON.parse(stdout));
                    return;
                } catch (error) {
                    console.log(`Unparseable sync output: ${error}\n${stdout.slice(0, 500)}`);
                    reject(ERROR_500);
                    return;
                }
            }
            // crash: log it, but don't show the traceback to the user
            if (stderr.includes("Traceback")) {
                console.log(stderr);
                reject(ERROR_500);
                return;
            }
            // expected failures (e.g. expired SID) are printed to stderr for the user
            if (stderr.trim()) {
                reject(ERROR_400(stderr.trim()));
                return;
            }
            reject(ERROR_500);
        });
    });
}

export default scrapeWithPython;

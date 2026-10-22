import readJsonFromObjectStorage from './os_readJsonObject.js';
import uploadObjectToObjectStorage from './os_uploadObject.js';

// A game's user listing (home page, search) as one Object Storage file, <usersDir>/index.json:
// { "<NAME#NUM>": { info: {...} }, ... }. Every sync updates its user's entry.
// Kept in memory after the first read; this process is the only writer, so updates run one at a time.
const indexes = new Map(); // objectName -> Promise<index>
const writes = new Map();  // objectName -> Promise of the latest queued update

function indexName(game) {
    return `${game.usersDir}/index.json`;
}

function readIndex(objectName) {
    if (!indexes.has(objectName)) {
        const index = readJsonFromObjectStorage(objectName).then((result) => {
            if (!result.error) {
                return result;
            }
            if (result.error.code === 404) {
                return {};  // no syncs yet
            }
            indexes.delete(objectName);  // retry on the next request
            throw new Error(`Unable to read ${objectName} (${result.error.code})`);
        });
        indexes.set(objectName, index);
    }
    return indexes.get(objectName);
}

// entries for every user (or players named `name`), most recently synced first
export async function listIndexedUsers(game, name) {
    const index = await readIndex(indexName(game));
    return Object.values(index)
        .filter((entry) => !name || entry.info.player === name)
        .sort((a, b) => b.info.timestamp - a.info.timestamp);
}

export function updateIndexedUser(game, user, entry) {
    const objectName = indexName(game);
    const previous = writes.get(objectName) || Promise.resolve();
    const update = previous.then(async () => {
        const index = { ...await readIndex(objectName), [user]: entry };
        const result = await uploadObjectToObjectStorage(objectName, JSON.stringify(index));
        if (result.error) {
            throw new Error(`Unable to update ${objectName} (${result.error.code})`);
        }
        indexes.set(objectName, Promise.resolve(index));
    });
    // a failed update shouldn't block the ones queued after it
    writes.set(objectName, update.catch(() => {}));
    return update;
}

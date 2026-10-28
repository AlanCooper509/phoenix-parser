import readJsonFromObjectStorage from './os_readJsonObject.js';
import uploadObjectToObjectStorage from './os_uploadObject.js';

// A game's user listing (home page, search) as one Object Storage file, <usersDir>/index.json:
// { "<NAME#NUM>": { info: {...} }, ... }. Every sync updates its user's entry.
// Listings come from a copy kept in memory after the first read (no request per page view; free tier).
// Updates don't trust that copy: more than one server can write (the VM, a dev server), so each update
// reads the file fresh and puts it back only if it hasn't changed since, retrying if it has.
// Within this process, updates still run one at a time.
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

// how many times an update re-reads and retries when another server wrote the file in between
const UPDATE_ATTEMPTS = 5;

// the index as stored now, with its version (eTag null when there's no index yet)
async function readFreshIndex(objectName) {
    const result = await readJsonFromObjectStorage(objectName, { withETag: true });
    if (!result.error) {
        return { index: result.json, eTag: result.eTag };
    }
    if (result.error.code === 404) {
        return { index: {}, eTag: null };
    }
    throw new Error(`Unable to read ${objectName} (${result.error.code})`);
}

export function updateIndexedUser(game, user, entry) {
    const objectName = indexName(game);
    const previous = writes.get(objectName) || Promise.resolve();
    const update = previous.then(async () => {
        for (let attempt = 1; ; attempt++) {
            const { index: stored, eTag } = await readFreshIndex(objectName);
            const index = { ...stored, [user]: entry };
            // only replaces the version just read (or, with none yet, only creates it)
            const result = await uploadObjectToObjectStorage(
                objectName, JSON.stringify(index), eTag ? { ifMatch: eTag } : { ifNoneMatch: '*' },
            );
            if (!result.error) {
                // the listings' copy catches up with every other server's syncs too
                indexes.set(objectName, Promise.resolve(index));
                return;
            }
            // 412: changed since it was read, so read it again
            if (result.error.code !== 412 || attempt === UPDATE_ATTEMPTS) {
                throw new Error(`Unable to update ${objectName} (${result.error.code})`);
            }
        }
    });
    // a failed update shouldn't block the ones queued after it
    writes.set(objectName, update.catch(() => {}));
    return update;
}

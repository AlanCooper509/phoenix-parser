import 'dotenv/config';

// Public piu-assets bucket (song jackets, avatars, chart lists), laid out as <game>/{songs,avatars,charts}/
const ASSETS_BASE_URL = process.env.ASSETS_BASE_URL
    || "https://objectstorage.ca-toronto-1.oraclecloud.com/n/yz1xhpsymsqz/b/piu-assets/o";

// chart files only change on a chart update, so keep them in memory instead of
// spending an Object Storage request (free tier: 50k/month) on every page load
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map(); // path -> { expires, promise }

async function fetchJson(path) {
    try {
        const response = await fetch(`${ASSETS_BASE_URL}/${path}`);
        if (!response.ok) {
            return {
                error: {
                    code: response.status,
                    message: "Unable to retrieve a requested JSON asset"
                }
            }
        }
        return await response.json();
    } catch (error) {
        return {
            error: {
                code: 500,
                message: "Unable to retrieve a requested JSON asset"
            }
        }
    }
}

async function readJsonFromAssets(path) {
    let entry = cache.get(path);
    if (!entry || entry.expires < Date.now()) {
        // cache the in-flight promise so concurrent requests share one fetch
        entry = { expires: Date.now() + CACHE_TTL_MS, promise: fetchJson(path) };
        cache.set(path, entry);
    }
    const result = await entry.promise;
    if (result.error) {
        cache.delete(path);  // retry failures on the next request
        return result;
    }
    // hand out a copy so callers can't modify the cached object
    return structuredClone(result);
}

export default readJsonFromAssets;

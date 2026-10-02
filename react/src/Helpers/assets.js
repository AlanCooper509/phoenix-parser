// Public piu-assets bucket, laid out as <game>/{songs,avatars,charts}/<hash>.png
// (the same hash can be a different image in each game, so always pass the game)
const ASSETS_BASE_URL = "https://objectstorage.ca-toronto-1.oraclecloud.com/n/yz1xhpsymsqz/b/piu-assets/o";

const DEFAULT_AVATAR_HASH = "4f617606e7751b2dc2559d80f09c40bf"; // "Azura"

// piugame.com image folders -> bucket folders (the folder tells which game it belongs to)
const PIUGAME_FOLDERS = {
    song_img: "phx1/songs",
    avatar_img: "phx1/avatars",
    song_img2: "phx2/songs",
    avatar_img2: "phx2/avatars",
};

export function songImg(game, hash) {
    return `${ASSETS_BASE_URL}/${game}/songs/${hash}.png`;
}

export function avatarImg(game, hash = DEFAULT_AVATAR_HASH) {
    return `${ASSETS_BASE_URL}/${game}/avatars/${hash}.png`;
}

// Synced data and chart lists store piugame.com image URLs
// (e.g. https://www.piugame.com/data/song_img/<hash>.png); serve our copy instead.
// Anything that doesn't match is returned unchanged.
export function fromPiugameUrl(url) {
    const match = /^https?:\/\/[^/]*piugame\.com\/data\/([a-z_0-9]+)\/([0-9a-f]+)\.png/.exec(url || "");
    if (!match || !PIUGAME_FOLDERS[match[1]]) {
        return url;
    }
    return `${ASSETS_BASE_URL}/${PIUGAME_FOLDERS[match[1]]}/${match[2]}.png`;
}

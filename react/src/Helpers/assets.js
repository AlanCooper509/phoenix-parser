// Public piu-assets bucket, laid out as <game>/{songs,avatars,charts}/<hash>.png
// (the same hash can be a different image in each game, so always pass the game)
const ASSETS_BASE_URL = "https://objectstorage.ca-toronto-1.oraclecloud.com/n/yz1xhpsymsqz/b/piu-assets/o";

const DEFAULT_AVATAR_HASH = "4f617606e7751b2dc2559d80f09c40bf"; // "Azura"

export function songImg(game, hash) {
    return `${ASSETS_BASE_URL}/${game}/songs/${hash}.png`;
}

export function avatarImg(game, hash = DEFAULT_AVATAR_HASH) {
    return `${ASSETS_BASE_URL}/${game}/avatars/${hash}.png`;
}

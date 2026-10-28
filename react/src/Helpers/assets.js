// Public piu-assets bucket, laid out as <game>/{songs,avatars,charts}/<hash>.png
// (plus phx2/pumbility/pumbility_NN.png, piugame's PUMBILITY tier icons; phx2/stepball/{s,d}_bg.png,
// its blank red singles and green doubles step balls, and s01..s28, d01..d29, c2..c5, the step balls
// with each level (or co-op player count) on; phx2/grade/<grade>.png, x_<grade>.png for fails; and
// phx2/plate/<plate>.png, s_<plate>.png for the small ones)
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

// PUMBILITY tier icon: 0 (no tier yet) .. 36, as numbered on piugame.com
export function pumbilityImg(game, icon) {
    return `${ASSETS_BASE_URL}/${game}/pumbility/pumbility_${String(icon).padStart(2, '0')}.png`;
}

// piugame's step ball for singles ('s') or doubles ('d')
export function stepballImg(game, type) {
    return `${ASSETS_BASE_URL}/${game}/stepball/${type}_bg.png`;
}

// a chart's step ball with its level on, as synced: type 's'/'d' and level "22", or co-op 'c' and "n2"
export function chartBallImg(game, type, level) {
    const name = type === 'c' ? `c${String(level).replace(/^n/, '')}` : `${type}${String(level).padStart(2, '0')}`;
    return `${ASSETS_BASE_URL}/${game}/stepball/${name}.png`;
}

// a grade as piugame draws it ("s_p", or "x_aa_p" for a fail)
export function gradeImg(game, grade) {
    return `${ASSETS_BASE_URL}/${game}/grade/${grade}.png`;
}

// a plate ("tg"), the small version unless `large`
export function plateImg(game, plate, large = false) {
    return `${ASSETS_BASE_URL}/${game}/plate/${large ? '' : 's_'}${plate}.png`;
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

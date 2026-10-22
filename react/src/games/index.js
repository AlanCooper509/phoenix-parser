import phx1Constants from './phx1/constants.json';
import phx1Cutoffs from './phx1/TitleCutoffs.json';

// per-game rules and display settings, keyed by the game id used in URLs and the API
const GAMES = {
    phx1: { id: "phx1", constants: phx1Constants, cutoffs: phx1Cutoffs },
};

// pages without a game in the URL (launch page) use the default game
export const DEFAULT_GAME = "phx1";

// old /user/... links (from before games were split) are Phoenix (1) pages
export const LEGACY_GAME = "phx1";

export function getGame(id) {
    return Object.hasOwn(GAMES, id) ? GAMES[id] : undefined;
}

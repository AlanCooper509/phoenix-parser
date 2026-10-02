import phx1 from './phx1.js';

const GAMES = { phx1 };

// routes without a game in the path (the pre-split /api/... URLs) mean Phoenix (1)
export const DEFAULT_GAME = "phx1";

export function getGame(id) {
    return Object.hasOwn(GAMES, id) ? GAMES[id] : undefined;
}

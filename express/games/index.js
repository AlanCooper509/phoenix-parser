import phx1 from './phx1.js';
import phx2 from './phx2.js';

const GAMES = { phx1, phx2 };

// routes without a game in the path (/api/...) mean Phoenix 2; Phoenix (1) is always /api/phx1/...
export const DEFAULT_GAME = "phx2";

export function getGame(id) {
    return Object.hasOwn(GAMES, id) ? GAMES[id] : undefined;
}

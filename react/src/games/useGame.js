import { useParams } from "react-router-dom";

import { DEFAULT_GAME, getGame } from "./index";

// the game for the current page: the :game URL segment, or the default game elsewhere
export default function useGame() {
    const { game } = useParams();
    return getGame(game) || getGame(DEFAULT_GAME);
}

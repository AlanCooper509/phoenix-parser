// Site path to a user's page in a game
export function userPath(game, name, number, tab) {
    const path = `/${game}/user/${name}/${number}`;
    return tab ? `${path}/${tab}` : path;
}

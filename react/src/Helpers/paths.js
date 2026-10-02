// Site path to a user's page (the one place to change once the game moves into the URL)
export function userPath(name, number, tab) {
    const path = `/user/${name}/${number}`;
    return tab ? `${path}/${tab}` : path;
}

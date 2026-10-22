import getUserID from '../helpers/getUserID.js';
import readJsonFromObjectStorage from '../helpers/os_readJsonObject.js';
import USER_FILES from '../helpers/userFiles.js';

async function getUser(req, game) {
    const name = req.params.name.toUpperCase();
    const number = req.params.number;
    const userId = getUserID(name, number);
    const userDir = `${game.usersDir}/${userId}`;

    // read the game's files for the page all at once
    const contents = await Promise.all(game.userFiles.map(
        (key) => readJsonFromObjectStorage(`${userDir}/${USER_FILES[key]}`)
    ));
    const files = Object.fromEntries(game.userFiles.map((key, i) => [key, contents[i]]));

    return game.buildUser(files);
}

export default getUser;

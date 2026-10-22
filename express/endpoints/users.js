async function getUsers(req, game) {
    let name;
    if (req.params.name) {
        name = req.params.name.toUpperCase();
    }

    let users = [];
    try {
        users = await game.listUsers(name);
    } catch (error) {
        console.log(error);
        return {
            error: {
                code: 500,
                message: "Error: unable to retrieve users! Try again later."
            }
        }
    }

    return {users};
}

export default getUsers;

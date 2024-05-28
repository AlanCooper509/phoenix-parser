import axios from 'axios';

import url from './url_params.json';

function updateButton(status, buttonRef) {
    for (let child of buttonRef.current.children) {
        buttonRef.current.removeChild(child);
    }
    const node = document.createElement("div");
    let text = '';
    switch (status) {
        case "SUCCESS":
            buttonRef.current.classList.add("btn-success");
            buttonRef.current.classList.remove("btn-secondary");
            buttonRef.current.classList.remove("btn-danger");
            text = document.createTextNode("✓");
            break;
        case "FAILURE":
            buttonRef.current.classList.add("btn-danger");
            buttonRef.current.classList.remove("btn-secondary");
            buttonRef.current.classList.remove("btn-success");
            text = document.createTextNode("✕");
            break;
        default:
            text = document.createTextNode('');
            break;
    }
    node.appendChild(text);
    buttonRef.current.appendChild(node);
}

function getUsers(setUsers, name='', buttonRef, setStatusText) {
    const fetchData = async () => {
        try {
            const response = await axios.get(`${location.protocol}//${url.host}:${url.port}/api/users/${name}`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setUsers(responseData["users"]);

            let userCount = responseData["users"].length;
            if (userCount === 0) {
                if (buttonRef) { updateButton("FAILURE", buttonRef); }
                if (setStatusText) { setStatusText(`No users found!`); }
            } 
            if (userCount > 0) {
                if (buttonRef) { updateButton("SUCCESS", buttonRef); }
                if (setStatusText) {
                    setStatusText(`Found ${responseData["users"].length} user${userCount === 1 ? '' : 's'}!`); 
                }
            }
        } catch (error) {
            if (buttonRef) { updateButton("FAILURE", buttonRef); }
            if (setStatusText) { setStatusText(`Error! Try again later.`); }
            setUsers([]);
        }
    };

    fetchData();
}

export default getUsers;
import axios from 'axios';

import getHostPath from './getHostPath';

function getUser(setInfo, setData, setTitles, setPumbility, name, number) {
    const fetchData = async (name, number) => {
        const hostname = getHostPath();
        try {
            const response = await axios.get(`${hostname}/api/user/${name}/${number}`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setInfo(responseData["info"]);
            setData(responseData["scores"]);
            setTitles(responseData["titles"]);
            setPumbility(responseData["pumbility"]);
        } catch (error) {
            setInfo({player: name, number: '#' + number, title: {text: "BEGINNER", color: "col5"}, last_updated: "Never"});
        }
    };

    fetchData(name, number);
}

export default getUser;
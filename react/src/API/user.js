import axios from 'axios';

function getUser(setInfo, setData, name, number) {
    const fetchData = async (name, number) => {
        try {
            const response = await axios.get(`http://192.168.1.71:3001/api/user/${name}/${number}`);
            const responseData = response.data;

            // Update state or perform actions with the data
            setInfo(responseData["info"]);
            setData(responseData["scores"]);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    fetchData(name, number);
}

export default getUser;
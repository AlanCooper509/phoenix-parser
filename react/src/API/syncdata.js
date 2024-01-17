import axios from 'axios';

import url from './url_params.json';

function postSyncData(name, number, submitBtn, sid) {
    const fetchData = async (name, number, sid) => {
        try {
            // Update state or perform actions with the data
            if (submitBtn.current) {
                submitBtn.current.classList.remove("btn-success");
                submitBtn.current.classList.remove("btn-danger");
                submitBtn.current.classList.add("btn-secondary");
                submitBtn.current.firstChild.innerHTML = '';
                submitBtn.current.firstChild.classList.add("spinner-border", "spinner-border-sm");
            }

            const response = await axios.post(`${url.protocol}://${url.host}:${url.port}/api/sync/${name}/${number}`, {
                sid: sid
            });
            const responseData = response.data;

            // Update state or perform actions with the data
            if (submitBtn.current) {
                submitBtn.current.firstChild.classList.remove("spinner-border", "spinner-border-sm");
                submitBtn.current.classList.add("btn-success");
                submitBtn.current.classList.remove("btn-secondary");
                submitBtn.current.firstChild.innerHTML = "Success!";
            }
            console.log(responseData);
        } catch (error) {
            if (submitBtn.current) {
                submitBtn.current.firstChild.classList.remove("spinner-border", "spinner-border-sm");
                submitBtn.current.firstChild.innerHTML = "Failed";
                submitBtn.current.classList.add("btn-danger");
                submitBtn.current.classList.remove("btn-secondary");
            }
            console.error('Error fetching data:', error);
        }
    };

    fetchData(name, number, sid);
}

export default postSyncData;
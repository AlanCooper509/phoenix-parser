import axios from 'axios';

import PlayerCard from '../Profile/PlayerCard.js';
import getHostPath from './getHostPath';

function postSyncData(params, submitBtn, openNotify) {
    const fetchData = async (name, number, sid) => {
        const hostname = getHostPath();
        try {
            // Update state or perform actions with the data
            if (submitBtn.current) {
                submitBtn.current.classList.remove("btn-success");
                submitBtn.current.classList.remove("btn-danger");
                submitBtn.current.classList.add("btn-secondary");
                submitBtn.current.firstChild.innerHTML = '';
                submitBtn.current.firstChild.classList.add("spinner-border", "spinner-border-sm");
            }

            const response = await axios.post(`${hostname}/api/sync/${name}/${number}`, {
                sid: sid
            });

            const info = response.data.info; // player / number / title / last_updated
            const scores = response.data.scores; // number
            const titles = response.data.titles; // number
            const pumbility = response.data.pumbility; // number
            openNotify(
                <div>
                    <h3 className="text-center">Data Sync: <span className="text-success">Complete</span></h3>
                    <hr/>
                    <PlayerCard
                        info={info}
                    />
                    <hr/>
                    <h4 className="mt-4">Synced data for&nbsp;
                        <span className="Game-name">
                            {info.player} {info.number}
                        </span>
                        :
                    </h4>
                    <h4>
                        <ul>
                            <li>
                                Best Scores: <code>{scores.toLocaleString()}</code>
                            </li>
                            <li>
                                Pumbility: <code>{pumbility.toLocaleString()}</code>
                            </li>
                            <li>
                                Titles: <code>{titles.toLocaleString()}</code>
                            </li>
                        </ul>
                    </h4>
                    <i className="text-muted">(Changes will display after you refresh the page)</i>
                </div>
            );

            // Update state or perform actions with the data
            if (submitBtn.current) {
                submitBtn.current.firstChild.classList.remove("spinner-border", "spinner-border-sm");
                submitBtn.current.classList.add("btn-success");
                submitBtn.current.classList.remove("btn-secondary");
                submitBtn.current.firstChild.innerHTML = "Success!";
            }
        } catch (error) {
            let response = '';
            // set error message displayed to user in modal
            if(error.code === "ERR_NETWORK") {
                response = "Network Error... Please try again later.";
            } else {
                response = error.response.data;
            }
            // update Submit Button text and CSS
            if (submitBtn.current) {
                submitBtn.current.firstChild.classList.remove("spinner-border", "spinner-border-sm");
                submitBtn.current.firstChild.innerHTML = "Failed";
                submitBtn.current.classList.add("btn-danger");
                submitBtn.current.classList.remove("btn-secondary");
            }
            // open modal with status message
            openNotify(
                <div>
                    <h3 className="text-center">Data Sync: <span className="text-danger">Failed</span></h3>
                    <hr/>
                    <p>{response}</p>
                </div>
            );
        }
    };

    fetchData(params.name, params.number, params.sid);
}

export default postSyncData;
import axios from 'axios';

import PlayerCard from '../Profile/PlayerCard.js';
import url from './url_params.json';

function postSyncData(params, submitBtn, openNotify) {
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

            const info = response.data.info; // player / number / title / last_updated
            const scores = response.data.scores; // number
            const titles = response.data.titles; // number
            openNotify(
                <div>
                    <h3 class="text-center">Data Sync: <span className="text-success">Complete</span></h3>
                    <hr/>
                    <PlayerCard
                        info={info}
                    />
                    <hr/>
                    <h4 className="mt-4">Synced data for&nbsp;
                        <span style={{color: "palevioletred"}}>
                            {info.player} {info.number}
                        </span>
                        :
                    </h4>
                    <h4>
                        <ul>
                            <li>
                                <code>{scores}</code> Best Scores
                            </li>
                            <li>
                                <code>{titles}</code> Titles
                            </li>
                        </ul>
                    </h4>
                    <i class="text-muted">(Changes will display after you refresh the page)</i>
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
            if (submitBtn.current) {
                submitBtn.current.firstChild.classList.remove("spinner-border", "spinner-border-sm");
                submitBtn.current.firstChild.innerHTML = "Failed";
                submitBtn.current.classList.add("btn-danger");
                submitBtn.current.classList.remove("btn-secondary");
            }
            openNotify(
                <div>
                    <h3 class="text-center">Data Sync: <span className="text-danger">Failed</span></h3>
                    <hr/>
                    <p>{error.response.data}</p>
                </div>
            );
        }
    };

    fetchData(params.name, params.number, params.sid);
}

export default postSyncData;
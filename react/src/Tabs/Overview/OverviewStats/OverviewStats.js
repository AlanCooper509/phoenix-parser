import Pumbility from './Pumbility.js';
import Titles from './Titles.js';
import HighestCleared from "./HighestCleared.js";

import "./OverviewStats.css";

function OverviewStats({info, scores, pumbility, titles}) {
    return (
        <div className="Overview-stats mt-4 w-100 rounded">
            <div className="container">
                <h3 className="mt-4">
                    {info.player} <i className="stat-description h6">{info.number}</i>
                </h3>
                <hr className="mt-2"></hr>
                <div className="container rounded">
                    <div className="row">
                        <div className="col my-2">
                            <Pumbility top50={pumbility} scores={scores}/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col my-2">
                            <HighestCleared scores={scores}/>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col my-2">
                            <Titles titles={titles}/>
                        </div>
                    </div>
                </div>
                <hr className="mb-2"></hr>
            </div>
        </div>
    );
}

export default OverviewStats;
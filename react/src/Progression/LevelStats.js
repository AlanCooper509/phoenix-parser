import { TbInfoCircle } from "react-icons/tb";
import BarChart from "./BarChart.js";

import "./LevelStats.css";

function LevelStats({cutoffs, rating, singles, doubles, charts, level}) {
    let titles = [];
    for (const idx in cutoffs) {
        let title = cutoffs[idx];
        const titleClasses = `font-title font-${title.tier}`;
        titles.push(
            <div key={idx} className="mt-3 ms-2">
                <h4 className={titleClasses}>{title.header}</h4>
                <div><TbInfoCircle/> {title.description}</div>
            </div>
        );
    }
    return (
        <div className="container">
            <div className="row align-items-center">
                <div className="col-4">
                    <h4>LEVEL {level}</h4>
                    {titles}
                </div>
                <div className="col-8 text-start">
                    <span className="float-end me-2 d-flex align-items-center">
                        <img className="stepball" src="https://www.piugame.com/l_img/stepball/full/s_bg.png"/>
                        <span className="ms-1 me-3"><b className="h3">{singles}</b>/{charts ? charts.singles : 0}</span>
                        <img className="stepball" src="https://www.piugame.com/l_img/stepball/full/d_bg.png"/>
                        <span className="ms-1 me-3"><b className="h3">{doubles}</b>/{charts ? charts.doubles : 0}</span>
                    </span>
                    <h4 className="">Rating: {rating.toLocaleString()}</h4>
                    <BarChart
                        cutoffs={cutoffs}
                        rating={rating}
                    />
                </div>
            </div>
        </div>
    );
}

export default LevelStats;
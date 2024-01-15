import { TbInfoCircle } from "react-icons/tb";
import BarChart from "./BarChart.js";

import "./LevelStats.css";

function LevelStats({cutoffs, rating, level}) {
    let titles = [];
    for (const idx in cutoffs) {
        let title = cutoffs[idx];
        const titleClasses = `font-title font-${title.tier}`;
        titles.push(
            <div className="mt-3 ms-2">
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
                <div className="col-8 text-center">
                    <h4 className="">Current Rating: {rating}</h4>
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
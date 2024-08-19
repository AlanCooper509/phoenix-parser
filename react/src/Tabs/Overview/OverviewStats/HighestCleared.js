import constants  from '../../../Helpers/constants.json'
import "./OverviewStats.css";

function HighestCleared({scores}) {
    let highestDoubles;
    let highestSingles;
    for (const level of constants.levelsDescending) {
        if (highestDoubles && highestSingles) { break; }
        if (!(level in scores)) { continue; }
        if (scores[level].doubles.count > 0 && !highestDoubles) {
            highestDoubles = level;
        }
        if (scores[level].singles.count > 0 && !highestSingles) {
            highestSingles = level;
        }
    }

    const singlesText = highestSingles ? `S${highestSingles}` : "S00";
    const doublesText = highestDoubles ? `D${highestDoubles}` : "D00";
    
    return (
        <div className="highest-cleared-item container py-3 rounded d-flex align-items-center justify-content-between">
            <h5 className="stat-description mb-0">Best Clears:</h5>
            <h5 className="mb-0"><span className="highest-single">{singlesText}</span> <span className="text-secondary">/</span> <span className="highest-double">{doublesText}</span></h5>
        </div>
    );
}

export default HighestCleared;
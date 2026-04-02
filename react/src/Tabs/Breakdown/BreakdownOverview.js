import LevelStats from '../Progression/LevelStats.js';

export default function BreakdownOverview({ data, chartData, levelValue, cutoffs }) {
    const currentLevelCutoffs = 
        cutoffs.intermediate[levelValue] || 
        cutoffs.advanced[levelValue] || 
        cutoffs.expert[levelValue];

    const showProgression = !!(currentLevelCutoffs && currentLevelCutoffs.length > 0);

    const dataKey = levelValue < 10 && !data[levelValue] ? `0${levelValue}` : levelValue;
    const levelData = data[dataKey] || {};

    return showProgression ? (
            <div className="container my-4 p-3 border rounded shadow-sm" style={{ width: '80%', minWidth: '780px', backgroundColor: 'rgb(31, 41, 54)' }}>
                <div className="row align-items-center">
                    <div className="col-md-12 ps-4">
                        <LevelStats
                            cutoffs={currentLevelCutoffs}
                            rating={levelData.rating || 0}
                            singles={levelData.singles?.count || 0}
                            doubles={levelData.doubles?.count || 0}
                            charts={chartData[dataKey]}
                            level={levelValue.toString()}
                        />
                    </div>
                </div>
            </div>
        ) : null;
}
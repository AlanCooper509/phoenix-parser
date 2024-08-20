import React, {useState} from 'react';

import constants  from '../../../Helpers/constants.json'
import PumbilityModal from './PumbilityModal.js'
import "./OverviewStats.css";

function manuallyCalculatePumbility(data) {
    let value = 0;
    let ratings = [];
    for (const level of constants.levelsDescending) {
        if (level < 10) { break; }
        if (!(level in data)) { continue; }
        const records = data[level].scores;
        for (const record of records) {
            if (ratings.length < 50) {
                ratings.push(record.rating);
                ratings.sort((a, b) => a - b);
            } else if (ratings[0] < record.rating) {
                ratings[0] = record.rating;
                ratings.sort((a, b) => a - b);
            }
        }
    }
    value = ratings.reduce((partialSum, a) => partialSum + a, 0);
    return value.toLocaleString();
}

function calculatePumbility(top50, scores) {
    let value = 0;
    if (top50.length > 0) {
        for (const record of top50) {
            value += parseInt(record.score.replace(/,/g, ""));
        }
        value = value.toLocaleString();
    } else {
        value = manuallyCalculatePumbility(scores);
    }
    return value;
}

function Pumbility({top50, scores}) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);

    let value = calculatePumbility(top50, scores);
    
    return (
        <>
            <div className="pumbility-stat-item container py-3 rounded d-flex align-items-center justify-content-between"
                style={{cursor: "pointer"}}
                onClick={() => {setShow(true)}} 
            >
                <h5 className="stat-description mb-1">Pumbility:</h5>
                <h3 className="mb-0">{value}</h3>
            </div>
            <PumbilityModal
                show={show}
                handleClose={handleClose}
                total={value}
                entries={top50}
            />
        </>
    );
}

export default Pumbility;
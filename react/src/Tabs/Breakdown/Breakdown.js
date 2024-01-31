import React, { useEffect, useState } from "react";

import getChartStats from '../../API/chartstats.js';

function Breakdown({info, data}) {
    const [chartData, setChartData] = useState({});
    useEffect(() => getChartStats(setChartData), []);

    console.log(info);
    console.log(data);
    console.log(chartData);
    return(
        <>
            "Hello, world!"
        </>
    );
}

export default Breakdown;
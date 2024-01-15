import charts from '../charts/v1_05_0/levelCounts.json' assert { type: "json" };

function getUser(req) {
    return charts;
}

export default getUser;
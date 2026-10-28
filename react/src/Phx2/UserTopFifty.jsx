import { useMemo, useState } from 'react';
import { Text } from '@chakra-ui/react';

import {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, NUMBER_FILTER_COLUMN, PLATE_COLUMN, ScoreTable, SONG_COLUMN,
} from './scoreGrid';
import { formatPumbility } from './shared';

// The charts that make up a PUMBILITY, laid out like Best Scores: rank, jacket, level, song, grade,
// plate and points, highest first. All is the total's best 50 (as piugame lists it); Singles and
// Doubles switch to the best 50 behind singles or doubles PUMBILITY instead of filtering it.
function RankCell({ data }) {
    return <Text color="fg.muted" fontVariantNumeric="tabular-nums">{data.rank}</Text>;
}
function PointsCell({ data }) {
    return <Text fontVariantNumeric="tabular-nums">{formatPumbility(data.points)}</Text>;
}
const TOP_FIFTY_COLUMNS = [
    { headerName: '#', field: 'rank', width: 64, cellRenderer: RankCell, sort: 'asc', ...NUMBER_FILTER_COLUMN, floatingFilter: false },
    JACKET_COLUMN,
    LEVEL_COLUMN,
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    { headerName: 'Points', field: 'points', width: 120, cellRenderer: PointsCell, ...NUMBER_FILTER_COLUMN },
];
const TOP_FIFTY_TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles']];
const TITLES = { all: 'Overall PUMBILITY', s: 'Singles PUMBILITY', d: 'Doubles PUMBILITY' };

// the best 50 counting charts of `type` (or of singles and doubles alike), as grid rows
function topFifty(scores, values, type) {
    return scores
        .filter((score) => (type === 'all' || score.type === type) && values.get(score) > 0)
        .sort((a, b) => values.get(b) - values.get(a))
        .slice(0, 50)
        .map((score, i) => ({ ...gridRow(score), rank: i + 1, points: values.get(score) }));
}

function UserTopFifty({ scores, summary }) {
    const [type, setType] = useState('all');
    const rows = useMemo(() => topFifty(scores, summary.valueOf, type), [scores, summary, type]);
    return (
        <ScoreTable
            title={TITLES[type]} rowData={rows} columnDefs={TOP_FIFTY_COLUMNS}
            types={TOP_FIFTY_TYPES} onTypeChange={setType}
            footer={rows.length < 50 && (
                <Text fontSize="sm" color="fg.muted" mt="3">{rows.length} of 50 so far: clear more charts to fill the rest.</Text>
            )}
        />
    );
}

export default UserTopFifty;

import { useMemo, useRef, useState } from 'react';
import { Text } from '@chakra-ui/react';

import { FilterButtons } from './UserOverview';
import {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, NUMBER_FILTER_COLUMN, PLATE_COLUMN, SCORE_COLUMN, ScoreTable, SONG_COLUMN,
} from './scoreGrid';
import { formatPumbility } from './shared';

// Best Scores: every chart's best, as on the Phoenix (1) page, in an ag-grid (sorting, a filter
// under each column, pages of 50), hardest clears first, or by each chart's PUMBILITY.

// one value column at a time: each chart's score, or its PUMBILITY
const VALUES = [['score', 'Score'], ['pumbility', 'PUMBILITY']];
// the sort each one starts with: the hardest clears first (level, then score), or PUMBILITY
const VALUE_SORTS = {
    score: [{ colId: 'levelNumber', sort: 'desc', sortIndex: 0 }, { colId: 'score', sort: 'desc', sortIndex: 1 }],
    pumbility: [{ colId: 'pumbility', sort: 'desc', sortIndex: 0 }],
};

// a chart's PUMBILITY, in green when it's one of the best 50 that make up the total
function PumbilityCell({ data }) {
    if (!data.pumbility) {
        return <Text color="fg.subtle">-</Text>;
    }
    return (
        <Text
            fontVariantNumeric="tabular-nums" color={data.best50 ? 'phx2.fg' : 'fg.muted'} fontWeight={data.best50 ? 'semibold' : 'normal'}
            title={data.best50 ? 'One of your best 50: counts toward your PUMBILITY' : 'Not in your best 50'}
        >
            {formatPumbility(data.pumbility)}
        </Text>
    );
}

const COLUMNS = [
    JACKET_COLUMN,
    { ...LEVEL_COLUMN, ...VALUE_SORTS.score[0] },
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    { ...SCORE_COLUMN, ...VALUE_SORTS.score[1] },
    {
        colId: 'pumbility', headerName: 'PUMBILITY', field: 'pumbility', width: 130, cellRenderer: PumbilityCell, hide: true,
        ...NUMBER_FILTER_COLUMN,
    },
];

function UserBestScores({ scores, summary }) {
    const grid = useRef(null);
    const [value, setValue] = useState('score');

    const rows = useMemo(() => scores.map((score) => ({
        ...gridRow(score),
        pumbility: summary.valueOf.get(score) || 0,
        best50: summary.topFifty.has(score),
    })), [scores, summary]);

    // Score or PUMBILITY: shows that column with its starting sort (so a hidden column never holds the sort)
    function showValue(column) {
        setValue(column);
        grid.current?.api?.applyColumnState({
            state: [...VALUES.map(([id]) => ({ colId: id, hide: id !== column })), ...VALUE_SORTS[column]],
            defaultState: { sort: null },
        });
    }

    return (
        <ScoreTable
            ref={grid}
            title="Best Scores"
            // the PUMBILITY cells' tooltips say what green means (one of the best 50)
            toolbar={<FilterButtons value={value} onChange={showValue} options={VALUES} />}
            failedToggle
            rowData={rows}
            columnDefs={COLUMNS}
            pagination
            paginationPageSize={50}
            paginationPageSizeSelector={[25, 50, 100, 200]}
        />
    );
}

export default UserBestScores;

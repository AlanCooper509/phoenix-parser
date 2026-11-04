import { useMemo, useRef } from 'react';
import { Text } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';

import { coopValue } from './pumbility';
import { FilterButtons } from './UserOverview';
import {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, NUMBER_FILTER_COLUMN, PLATE_COLUMN, SCORE_COLUMN, ScoreTable, SONG_COLUMN,
} from './scoreGrid';
import { formatPumbility } from './shared';

// Best Scores: every chart's best, as on the Phoenix (1) page, in an ag-grid (sorting, a filter
// under each column, pages of 50), hardest clears first, or by each chart's rating: what it's worth toward
// PUMBILITY, or for co-op charts, which have none, toward CO-OP Rating.

// one value column at a time: each chart's score, or its rating
const VALUES = [['score', 'Score'], ['pumbility', 'Rating']];
// the sort each one starts with: the hardest clears first (level, then score), or rating
const VALUE_SORTS = {
    score: [{ colId: 'levelNumber', sort: 'desc', sortIndex: 0 }, { colId: 'score', sort: 'desc', sortIndex: 1 }],
    pumbility: [{ colId: 'pumbility', sort: 'desc', sortIndex: 0 }],
};

// a chart's rating, in green when it counts toward the total: one of the best 50 for PUMBILITY, and every
// co-op clear for CO-OP Rating
function PumbilityCell({ data }) {
    if (!data.pumbility) {
        return <Text color="fg.subtle">-</Text>;
    }
    const coop = data.type === 'c';
    const counts = coop || data.best50;
    const says = data.best50 ? 'One of your best 50: counts toward your PUMBILITY' : 'Not in your best 50';
    return (
        <Text
            fontVariantNumeric="tabular-nums" color={counts ? 'phx2.fg' : 'fg.muted'} fontWeight={counts ? 'semibold' : 'normal'}
            title={coop ? 'Counts toward your CO-OP Rating' : says}
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
        colId: 'pumbility', headerName: 'Rating', headerTooltip: 'What the chart adds to PUMBILITY (CO-OP Rating for co-op charts)',
        field: 'pumbility', width: 120, cellRenderer: PumbilityCell, hide: true,
        ...NUMBER_FILTER_COLUMN,
    },
];

// the same, starting on Rating, for a link that opens on it
const RATING_COLUMNS = COLUMNS.map((column) => {
    const id = column.colId ?? column.field;
    if (id === 'pumbility') {
        return { ...column, hide: false, sort: 'desc', sortIndex: 0 };
    }
    return id === 'score' ? { ...column, hide: true, sort: null, sortIndex: null } : { ...column, sort: null, sortIndex: null };
});

function UserBestScores({ scores, summary, nav, type, onCountChange }) {
    const grid = useRef(null);
    // in the URL (?value=rating; nothing for Score), so a shared link opens on it
    const [params, setParams] = useSearchParams();
    const value = params.get('value') === 'rating' ? 'pumbility' : 'score';
    // only what the grid starts with: it keeps its own columns after that
    const startColumns = useRef(value === 'pumbility' ? RATING_COLUMNS : COLUMNS);

    const rows = useMemo(() => scores.map((score) => ({
        ...gridRow(score),
        pumbility: score.type === 'c' ? coopValue(score) : summary.valueOf.get(score) || 0,
        best50: summary.topFifty.has(score),
    })), [scores, summary]);

    // Score or Rating: shows that column with its starting sort (so a hidden column never holds the sort)
    const showValue = (column) => {
        setParams((current) => {
            const updated = new URLSearchParams(current);
            if (column === 'pumbility') {
                updated.set('value', 'rating');
            } else {
                updated.delete('value');
            }
            return updated;
        }, { replace: true });
        grid.current?.api?.applyColumnState({
            state: [...VALUES.map(([id]) => ({ colId: id, hide: id !== column })), ...VALUE_SORTS[column]],
            defaultState: { sort: null },
        });
    };

    return (
        <ScoreTable
            ref={grid}
            title="Best Scores" shortTitle="Best" nav={nav} type={type} onCountChange={onCountChange}
            // the rating cells' tooltips say what green means (it counts toward the total)
            toolbar={<FilterButtons value={value} onChange={showValue} options={VALUES} />}
            failedToggle
            rowData={rows}
            columnDefs={startColumns.current}
            pagination
            paginationPageSize={50}
            paginationPageSizeSelector={[25, 50, 100, 200]}
        />
    );
}

export default UserBestScores;

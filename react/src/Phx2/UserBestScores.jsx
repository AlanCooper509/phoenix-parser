import { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Checkbox, Heading, HStack, Separator, Text } from '@chakra-ui/react';

import { FilterButtons } from './UserOverview';
import ScoreGrid, { GRADE_COLUMN, gridRow, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, SONG_COLUMN } from './scoreGrid';
import { formatPumbility } from './shared';

// Best Scores: every chart's best, as on the Phoenix (1) page, in an ag-grid (sorting, a filter
// under each column, pages of 50), with each chart's PUMBILITY.

const TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles'], ['c', 'Co-op']];
// one value column at a time: each chart's score, or its PUMBILITY
const VALUES = [['pumbility', 'PUMBILITY'], ['score', 'Score']];
// below 640px, Grade and Plate fold away so the song keeps room
const FOLD = [[640, ['grade', 'plate']]];

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
    LEVEL_COLUMN,
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    { ...SCORE_COLUMN, hide: true },
    {
        colId: 'pumbility', headerName: 'PUMBILITY', field: 'pumbility', width: 130, cellRenderer: PumbilityCell, sort: 'desc',
        filter: 'agNumberColumnFilter', floatingFilter: true,
    },
];

function UserBestScores({ scores, summary }) {
    const grid = useRef(null);
    const [type, setType] = useState('all');
    const [value, setValue] = useState('pumbility');
    // fails and STAGE BREAKs alike: bests that weren't clears
    const [failed, setFailed] = useState(false);
    // how many rows pass every filter (the type buttons, the checkbox and the column filters)
    const [count, setCount] = useState(scores.length);

    const rows = useMemo(() => scores.map((score) => ({
        ...gridRow(score),
        pumbility: summary.valueOf.get(score) || 0,
        best50: summary.topFifty.has(score),
    })), [scores, summary]);

    // the type buttons and the failed checkbox filter alongside the grid's own column filters
    const filters = useRef({ type, failed });
    filters.current = { type, failed };
    const isExternalFilterPresent = useCallback(() => filters.current.type !== 'all' || !filters.current.failed, []);
    const doesExternalFilterPass = useCallback(({ data }) => (
        (filters.current.type === 'all' || data.type === filters.current.type) && (filters.current.failed || data.cleared)
    ), []);
    const refilter = (set) => (next) => {
        set(next);
        // after React has applied the new value to filters.current
        setTimeout(() => grid.current?.api?.onFilterChanged());
    };

    // Score or PUMBILITY: shows that column, sorted highest first (so a hidden column never holds the sort)
    function showValue(column) {
        setValue(column);
        grid.current?.api?.applyColumnState({
            state: VALUES.map(([id]) => ({ colId: id, hide: id !== column, sort: id === column ? 'desc' : null })),
            defaultState: { sort: null },
        });
    }

    return (
        <Box>
            <HStack justify="space-between" wrap="wrap" gap="3" mb="4">
                <FilterButtons value={type} onChange={refilter(setType)} options={TYPES} />
                <FilterButtons value={value} onChange={showValue} options={VALUES} />
            </HStack>
            <Separator borderColor="border" mb="4" />
            {/* right over the table: the count as on Phoenix (1), and a small fails toggle */}
            <HStack justify="space-between" align="end" gap="3" mb="2">
                {/* sized like the PUMBILITY tab's section headings */}
                <Heading as="h4" size="lg" title={`${count.toLocaleString()} of ${scores.length.toLocaleString()} best scores`}>
                    Best Scores <Text as="span" color="fg.muted" fontWeight="normal">({count.toLocaleString()})</Text>
                </Heading>
                <Checkbox.Root
                    size="xs" colorPalette="phx2" checked={failed} onCheckedChange={(e) => refilter(setFailed)(!!e.checked)}
                >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label fontSize="xs" color="fg.muted" fontWeight="normal" ms="1.5">Failed and stage breaks</Checkbox.Label>
                </Checkbox.Root>
            </HStack>
            <ScoreGrid
                ref={grid}
                rowData={rows}
                columnDefs={COLUMNS}
                fold={FOLD}
                pagination
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                isExternalFilterPresent={isExternalFilterPresent}
                doesExternalFilterPass={doesExternalFilterPass}
                onModelUpdated={({ api }) => setCount(api.getDisplayedRowCount())}
            />
            {value === 'pumbility' && (
                <Text fontSize="sm" color="fg.muted" mt="3">
                    PUMBILITY in green: one of your best 50, which add up to your total.
                </Text>
            )}
        </Box>
    );
}

export default UserBestScores;

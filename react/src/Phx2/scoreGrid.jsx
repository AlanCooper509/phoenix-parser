import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Box, Checkbox, Heading, HStack, Image, Separator, Text } from '@chakra-ui/react';

import { chartBallImg, gradeImg, plateImg } from '../Helpers/assets';

import { GRADES, gradeLabel, gradeRank, isCleared, PLATE_NAMES } from './pumbility';
import { ChartBadge, Jacket } from './shared';
import { FilterButtons } from './UserOverview';

// The ag-grid behind Best Scores and Recently Played: its dark theme recolored to Phoenix 2 (.phx2-grid
// in Phx2.css), the cells and sorting both share, and columns that fold away on narrow screens.

// a score or play as a grid row: a level number to sort and filter by (co-op charts go by player
// count, "n2" as synced, as their C2 badge shows), its grade as text, and whether it was cleared.
// A chart never played (`unplayed`, from Breakdown's chart list) has no grade or score.
export function gridRow(score) {
    let gradeText = score.stageBreak || !score.grade ? 'Stage break' : gradeLabel(score.grade);
    if (score.unplayed) {
        gradeText = 'Not played';
    }
    return {
        ...score,
        levelNumber: Number(String(score.level).replace(/^n/, '')) || null,
        gradeText,
        cleared: isCleared(score),
    };
}

// ---- cells (outside components, so re-renders don't remount every cell)

const middle = { h: 'full', align: 'center' };

// piugame's step ball with the level on (the S22 badge for one there's no image of)
function LevelCell({ data }) {
    const [missing, setMissing] = useState(false);
    const label = data.type === 'c' ? `Co-op x${String(data.level).replace(/^n/, '')}` : `${data.type.toUpperCase()}${Number(data.level)}`;
    return (
        // right-aligned, next to the song
        <HStack {...middle} justify="end">
            {missing
                ? <ChartBadge type={data.type} level={data.level} />
                : <Image src={chartBallImg('phx2', data.type, data.level)} alt={label} title={label} boxSize="40px" onError={() => setMissing(true)} />}
        </HStack>
    );
}

function JacketCell({ data }) {
    return <HStack {...middle}><Jacket jacket={data.jacket} w="80px" /></HStack>;
}

function SongCell({ data }) {
    return <Text truncate title={data.name}>{data.name}</Text>;
}

// piugame's grade art (a fail's is its cracked x_ version); a STAGE BREAK has none
function GradeCell({ data }) {
    if (data.unplayed) {
        return <Text color="fg.subtle">Not played</Text>;
    }
    if (data.stageBreak || !data.grade) {
        return <Text color="fg.muted">Stage break</Text>;
    }
    const label = `${gradeLabel(data.grade)}${data.cleared ? '' : ' (failed)'}`;
    return <HStack {...middle}><Image src={gradeImg('phx2', data.grade)} alt={label} title={label} h="28px" w="auto" /></HStack>;
}

function PlateCell({ data }) {
    if (!data.cleared || !data.plate) {
        return <Text color="fg.subtle">-</Text>;
    }
    return (
        <HStack {...middle}>
            <Image src={plateImg('phx2', data.plate)} alt={PLATE_NAMES[data.plate]} title={PLATE_NAMES[data.plate]} h="20px" w="auto" />
        </HStack>
    );
}

function ScoreCell({ data }) {
    return <Text color={data.cleared ? 'fg' : 'fg.muted'} fontVariantNumeric="tabular-nums">{data.score?.toLocaleString() ?? '-'}</Text>;
}

// ---- sorting: grades by score (as Phoenix 1), plates in plate order, ties by level

const PLATES = ['rg', 'fg', 'tg', 'mg', 'sg', 'eg', 'ug', 'pg'];
const byLevel = (a, b) => (a.levelNumber ?? -1) - (b.levelNumber ?? -1);
const byScore = (a, b) => ((a.score ?? -1) - (b.score ?? -1)) || byLevel(a, b);
export const comparing = (compare) => (valueA, valueB, nodeA, nodeB) => compare(nodeA.data, nodeB.data);

// ---- filters, without the Blank / Not blank options (every score has a level, song and value)

const NUMBER_FILTER = {
    filterOptions: ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'inRange'],
};
export const NUMBER_FILTER_COLUMN = { filter: 'agNumberColumnFilter', floatingFilter: true, filterParams: NUMBER_FILTER };
const TEXT_FILTER = {
    filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
};

// Grades and plates filter by rank, as players think of them ("below AA", "PG or better"): typed as
// their names (AA+, PG), compared in order, at least the one typed by default.
function rankFilter(labels) {
    const ranks = Object.fromEntries(labels.map((label, i) => [label.toUpperCase(), i]));
    return {
        filterOptions: ['greaterThanOrEqual', 'lessThanOrEqual', 'greaterThan', 'lessThan', 'equals', 'notEqual', 'inRange'],
        defaultOption: 'greaterThanOrEqual',
        allowedCharPattern: 'A-Za-z\\+',
        numberParser: (text) => ranks[text?.trim().toUpperCase()] ?? null,
        numberFormatter: (rank) => labels[rank] ?? null,
    };
}

// ---- columns

// the song's jacket, first: jacket, then level, then song
export const JACKET_COLUMN = {
    // the jacket at 80px wide (45px tall, its 16:9), with tighter padding than other cells
    colId: 'jacket', headerName: '', width: 100, cellRenderer: JacketCell, sortable: false,
    cellStyle: { paddingLeft: '10px', paddingRight: '10px' },
};
export const LEVEL_COLUMN = {
    // just wider than the 40px step ball (and "Level" with a sort arrow), with tighter padding than other
    // cells, so it sits close to the song
    headerName: 'Level', field: 'levelNumber', width: 74, cellRenderer: LevelCell,
    cellStyle: { paddingLeft: '8px', paddingRight: '8px' }, headerClass: 'phx2-grid-tight',
    // no filter button in a column this narrow: the box takes its width, and a level typed there matches exactly
    ...NUMBER_FILTER_COLUMN,
    floatingFilterComponentParams: { suppressFilterButton: true },
};
export const SONG_COLUMN = {
    headerName: 'Song', field: 'name', flex: 1, minWidth: 180, cellRenderer: SongCell,
    filter: 'agTextColumnFilter', floatingFilter: true, filterParams: TEXT_FILTER,
};
export const GRADE_COLUMN = {
    colId: 'grade', headerName: 'Grade', field: 'gradeText', width: 100, cellRenderer: GradeCell, comparator: comparing(byScore),
    // by rank: a fail counts as the grade it reached; a STAGE BREAK (no grade) never matches
    filter: 'agNumberColumnFilter', floatingFilter: true, filterValueGetter: ({ data }) => gradeRank(data.grade),
    filterParams: rankFilter(GRADES.map(([, label]) => label)),
};
export const PLATE_COLUMN = {
    colId: 'plate', headerName: 'Plate', field: 'plate', width: 84, cellRenderer: PlateCell,
    comparator: comparing((a, b) => (PLATES.indexOf(a.plate) - PLATES.indexOf(b.plate)) || byScore(a, b)),
    // by rank, RG to PG: only cleared plays have a plate
    filter: 'agNumberColumnFilter', floatingFilter: true,
    filterValueGetter: ({ data }) => (data.cleared && data.plate ? PLATES.indexOf(data.plate) : null),
    filterParams: rankFilter(PLATES.map((plate) => plate.toUpperCase())),
};
export const SCORE_COLUMN = {
    colId: 'score', headerName: 'Score', field: 'score', width: 120, cellRenderer: ScoreCell, comparator: comparing(byScore),
    ...NUMBER_FILTER_COLUMN,
};

const DEFAULT_COLUMN = { sortable: true, suppressMovable: true, suppressMenu: true, resizable: false };

// below this grid width the jacket (decoration: the song's name is beside it) folds away, so the
// data columns need less sideways scrolling on phones
const JACKET_FOLD = [480, ['jacket']];

// The themed grid. `fold`: [[width, colIds], ...], more columns hidden while the grid is narrower than
// that width. Other props go to AgGridReact.
const ScoreGrid = forwardRef(function ScoreGrid({ fold: moreFold = [], ...props }, ref) {
    const fold = useMemo(() => [JACKET_FOLD, ...moreFold], [moreFold]);
    const fitColumns = useCallback(({ api, clientWidth }) => {
        if (clientWidth) {
            fold.forEach(([width, colIds]) => api.setColumnsVisible(colIds, clientWidth >= width));
        }
    }, [fold]);
    return (
        <Box className="ag-theme-quartz-dark phx2-grid" w="full">
            <AgGridReact
                ref={ref}
                defaultColDef={DEFAULT_COLUMN}
                // room for the 45px-tall jackets
                rowHeight={56}
                domLayout="autoHeight"
                onGridSizeChanged={fitColumns}
                onFirstDataRendered={fitColumns}
                suppressCellFocus
                {...props}
            />
        </Box>
    );
});

// ---- the table around the grid, the same on Best Scores, Recently Played and the best 50

const TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles'], ['c', 'Co-op']];

// `title` with the count of rows passing every filter (as on Phoenix 1) and, with `failedToggle`, a
// small checkbox for fails and STAGE BREAKs (rows that aren't clears; ticked to start with
// `failedShown`), a divider, then
// the type buttons (and `toolbar`, on the right) right over the grid. The buttons filter the rows by
// type (`types` sets them); with `onTypeChange`, they call it instead, for the parent to swap the rows. `footer` goes under it; `ref`
// reaches the grid's api. Other props go to ScoreGrid.
export const ScoreTable = forwardRef(function ScoreTable({
    title, toolbar, failedToggle = false, failedShown = false, footer, rowData, types = TYPES, onTypeChange, ...props
}, ref) {
    const grid = useRef(null);
    useImperativeHandle(ref, () => grid.current, []);
    const [type, setType] = useState('all');
    const [failed, setFailed] = useState(!failedToggle || failedShown);
    // starts as what the grid will show, so the heading doesn't flash the unfiltered count first
    const [count, setCount] = useState(() => rowData.filter((row) => failed || row.cleared).length);

    const filters = useRef({ type, failed });
    filters.current = { type, failed };
    // with onTypeChange the rows already are the type picked
    const filtersType = !onTypeChange;
    const isExternalFilterPresent = useCallback(() => (filtersType && filters.current.type !== 'all') || !filters.current.failed, [filtersType]);
    const doesExternalFilterPass = useCallback(({ data }) => (
        (!filtersType || filters.current.type === 'all' || data.type === filters.current.type) && (filters.current.failed || data.cleared)
    ), [filtersType]);
    const refilter = (set) => (next) => {
        set(next);
        // after React has applied the new value to filters.current
        setTimeout(() => grid.current?.api?.onFilterChanged());
    };

    return (
        <Box>
            <HStack justify="space-between" align="end" gap="3" mb="3">
                <Heading as="h4" size="lg" title={`${count.toLocaleString()} of ${rowData.length.toLocaleString()}`}>
                    {title} <Text as="span" color="fg.muted" fontWeight="normal">({count.toLocaleString()})</Text>
                </Heading>
                {failedToggle && (
                    <Checkbox.Root
                        size="xs" colorPalette="phx2" checked={failed} onCheckedChange={(e) => refilter(setFailed)(!!e.checked)}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                        <Checkbox.Label fontSize="xs" color="fg.muted" fontWeight="normal" ms="1.5">Failed and stage breaks</Checkbox.Label>
                    </Checkbox.Root>
                )}
            </HStack>
            <Separator borderColor="border" mb="4" />
            <HStack justify="space-between" wrap="wrap" gap="3" mb="4">
                <FilterButtons
                    value={type} options={types}
                    onChange={onTypeChange ? (next) => { setType(next); onTypeChange(next); } : refilter(setType)}
                />
                {toolbar}
            </HStack>
            <ScoreGrid
                ref={grid}
                rowData={rowData}
                isExternalFilterPresent={isExternalFilterPresent}
                doesExternalFilterPass={doesExternalFilterPass}
                onModelUpdated={({ api }) => setCount(api.getDisplayedRowCount())}
                {...props}
            />
            {footer}
        </Box>
    );
});

export default ScoreGrid;

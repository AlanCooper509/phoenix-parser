import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Box, Checkbox, Heading, HStack, Image, Separator, Text } from '@chakra-ui/react';

import { chartBallImg, gradeImg, plateImg } from '../Helpers/assets';

import { GRADES, gradeLabel, gradeRank, isCleared, PLATE_NAMES } from './pumbility';
import { ChartBadge, Jacket } from './shared';
import { FILTER_STYLE, FilterButtons } from './UserOverview';

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
                : <Image src={chartBallImg('phx2', data.type, data.level)} alt={label} title={label} boxSize="40px" className="phx2-grid-ball" onError={() => setMissing(true)} />}
        </HStack>
    );
}

function JacketCell({ data }) {
    return <HStack {...middle}><Jacket jacket={data.jacket} w="80px" className="phx2-grid-jacket" /></HStack>;
}

function SongCell({ data }) {
    return <Text truncate title={data.name}>{data.name}</Text>;
}

// piugame's grade art (a fail's is its cracked x_ version); a STAGE BREAK has none. Right-aligned,
// next to the plate. The words wrap to two lines where the column is narrow (compact).
const GRADE_TEXT = { textAlign: 'end', whiteSpace: 'normal', lineHeight: '1.2' };
function GradeCell({ data }) {
    if (data.unplayed) {
        return <HStack {...middle} justify="end"><Text color="fg.subtle" {...GRADE_TEXT}>Not played</Text></HStack>;
    }
    if (data.stageBreak || !data.grade) {
        // just "Break" in compact grids (Phx2.css), so it stays on one line
        return (
            <HStack {...middle} justify="end">
                <Text color="fg.muted" {...GRADE_TEXT}>
                    <span className="phx2-grid-full">Stage break</span><span className="phx2-grid-short">Break</span>
                </Text>
            </HStack>
        );
    }
    const label = `${gradeLabel(data.grade)}${data.cleared ? '' : ' (failed)'}`;
    return <HStack {...middle} justify="end"><Image src={gradeImg('phx2', data.grade)} alt={label} title={label} h="28px" w="auto" className="phx2-grid-grade" /></HStack>;
}

function PlateCell({ data }) {
    if (!data.cleared || !data.plate) {
        return <Text color="fg.subtle">-</Text>;
    }
    return (
        <HStack {...middle}>
            <Image src={plateImg('phx2', data.plate)} alt={PLATE_NAMES[data.plate]} title={PLATE_NAMES[data.plate]} h="20px" w="auto" className="phx2-grid-plate" />
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
    // takes the room left over: at least enough for a short title even on phones (compact)
    headerName: 'Song', field: 'name', flex: 1, minWidth: 80, cellRenderer: SongCell,
    filter: 'agTextColumnFilter', floatingFilter: true, filterParams: TEXT_FILTER,
};
export const GRADE_COLUMN = {
    colId: 'grade', headerName: 'Grade', field: 'gradeText', width: 100, cellRenderer: GradeCell, comparator: comparing(byScore),
    // right-aligned like its cells, so the grade sits by the plate
    headerClass: 'ag-right-aligned-header phx2-grid-near-next', cellClass: 'phx2-grid-near-next',
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

// Below this grid width (phones) the grid goes compact: smaller text, padding, images and rows
// (.phx2-grid-compact in Phx2.css), and these columns narrower, so the song, level, grade, plate and
// score fit without scrolling sideways. Columns not in a grid are skipped.
const COMPACT_WIDTH = 600;
const COMPACT_COLUMNS = { jacket: 72, levelNumber: 42, grade: 62, plate: 52, score: 70, scorePlayed: 74, pumbility: 70, rank: 28, points: 54 };
// shorter headers where the full one won't fit beside its sort arrow
const COMPACT_HEADERS = { levelNumber: 'Lv.' };

const columnId = (colDef) => colDef.colId ?? colDef.field;

// the columns as laid out for a grid `width` wide: compact widths and headers below COMPACT_WIDTH, and
// the folded columns hidden (or their narrow stand-ins shown)
function layoutColumns(columnDefs, width, fold) {
    const compact = width < COMPACT_WIDTH;
    const hidden = new Map();
    fold.forEach(([foldWidth, colIds, narrowColIds = []]) => {
        colIds.forEach((id) => hidden.set(id, width < foldWidth));
        narrowColIds.forEach((id) => hidden.set(id, width >= foldWidth));
    });
    return columnDefs.map((colDef) => {
        const id = columnId(colDef);
        return {
            ...colDef,
            width: (compact && COMPACT_COLUMNS[id]) || colDef.width,
            headerName: (compact && COMPACT_HEADERS[id]) || colDef.headerName,
            hide: hidden.has(id) ? hidden.get(id) : colDef.hide,
        };
    });
}

// The themed grid. `fold`: [[width, colIds, narrowColIds], ...], more columns hidden while the grid is
// narrower than that width (and `narrowColIds`, hidden otherwise, shown instead). Other props go to
// AgGridReact.
// one empty fold for every grid without its own: a new [] each render would rebuild the columns (and
// ag-grid re-apply their definitions, undoing sorts and shown columns) on every render
const NO_FOLD = [];

const ScoreGrid = forwardRef(function ScoreGrid({ fold: moreFold = NO_FOLD, columnDefs, ...props }, ref) {
    const fold = useMemo(() => [JACKET_FOLD, ...moreFold], [moreFold]);
    // measured before the grid first draws, so it starts in the right layout (no flash of the wide one
    // on phones); null until then
    const box = useRef(null);
    const [width, setWidth] = useState(null);
    useLayoutEffect(() => {
        setWidth(box.current.clientWidth);
    }, []);
    const [compact, setCompact] = useState(false);
    // the layout the grid starts with; resizes after that go through fitColumns
    const startWidth = useRef(null);
    if (startWidth.current === null && width !== null) {
        startWidth.current = width;
    }
    const startColumns = useMemo(
        () => (startWidth.current === null ? null : layoutColumns(columnDefs, startWidth.current, fold)),
        [columnDefs, fold, width === null], // eslint-disable-line react-hooks/exhaustive-deps
    );
    useLayoutEffect(() => {
        if (width !== null) {
            setCompact(width < COMPACT_WIDTH);
        }
    }, [width]);

    const api = useRef(null);
    const fitColumns = useCallback(({ api: gridApi, clientWidth }) => {
        api.current = gridApi;
        if (!clientWidth) {
            return;
        }
        const laidOut = layoutColumns(columnDefs, clientWidth, fold);
        setCompact(clientWidth < COMPACT_WIDTH);
        // headers aren't column state: set on the grid's own copies of the definitions
        laidOut.forEach(({ headerName }, i) => {
            const colDef = gridApi.getColumn(columnId(columnDefs[i]))?.getColDef();
            if (colDef && colDef.headerName !== headerName) {
                colDef.headerName = headerName;
            }
        });
        gridApi.refreshHeader();
        // only what the width decides: the compact-sized columns' widths and the folded columns'
        // visibility (others, like Best Scores' Score / PUMBILITY, keep whatever they were set to)
        const folded = new Set(fold.flatMap(([, colIds, narrowColIds = []]) => [...colIds, ...narrowColIds]));
        gridApi.applyColumnState({
            state: laidOut
                .filter((colDef) => gridApi.getColumn(columnId(colDef)) && (COMPACT_COLUMNS[columnId(colDef)] || folded.has(columnId(colDef))))
                .map((colDef) => ({
                    colId: columnId(colDef),
                    ...(COMPACT_COLUMNS[columnId(colDef)] && { width: colDef.width }),
                    ...(folded.has(columnId(colDef)) && { hide: colDef.hide }),
                })),
        });
    }, [columnDefs, fold]);
    // rows already drawn take the new height
    useEffect(() => {
        api.current?.resetRowHeights();
    }, [compact]);
    return (
        <Box ref={box} className={`ag-theme-quartz-dark phx2-grid${compact ? ' phx2-grid-compact' : ''}`} w="full">
            {startColumns && (
                <AgGridReact
                    ref={ref}
                    columnDefs={startColumns}
                    defaultColDef={DEFAULT_COLUMN}
                    // room for the 45px-tall jackets (smaller when compact)
                    rowHeight={compact ? 44 : 56}
                    domLayout="autoHeight"
                    onGridSizeChanged={fitColumns}
                    onFirstDataRendered={fitColumns}
                    suppressCellFocus
                    {...props}
                />
            )}
        </Box>
    );
});

// another view's name beside a table's heading (smaller, muted), which switches to it
export function ViewLink({ label, onClick }) {
    return (
        <Text
            as="button" type="button" onClick={onClick} fontSize={{ base: 'xs', sm: 'sm' }} fontWeight="medium" color="fg.muted"
            whiteSpace="nowrap" cursor="pointer" _hover={{ color: 'fg' }} transition="color 0.15s"
        >
            {label}
        </Text>
    );
}

// the heading, between `nav`'s links if any, bottoms lined up
export function TableHeading({ nav, children }) {
    if (!nav) {
        return children;
    }
    return (
        <HStack gap={{ base: '3', sm: '4' }} align="baseline">
            {nav.before}
            {children}
            {nav.after}
        </HStack>
    );
}

// ---- the table around the grid, the same on Best Scores, Recently Played and the best 50

const TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles'], ['c', 'Co-op']];

// `title` with the count of rows passing every filter (as on Phoenix 1) and, with `failedToggle`, a
// small checkbox for fails and STAGE BREAKs (rows that aren't clears; ticked to start with
// `failedShown`), a divider, then
// the type buttons (and `toolbar`, on the right) right over the grid. The buttons filter the rows by
// type (`types` sets them); with `onTypeChange`, they call it instead, for the parent to swap the rows.
// `toolbar` can also be a function of the type picked. `nav` ({ before, after }) goes either side of the
// heading (Scores' other views). `footer` goes under it; `ref` reaches the grid's api. Other props go to ScoreGrid.
export const ScoreTable = forwardRef(function ScoreTable({
    title, nav, toolbar, failedToggle = false, failedShown = false, footer, rowData, types = TYPES, onTypeChange, ...props
}, ref) {
    const grid = useRef(null);
    // read through to the grid when used: it mounts a render after this table (once ScoreGrid has
    // measured its width), so it isn't there yet when the handle is made
    useImperativeHandle(ref, () => ({ get api() { return grid.current?.api; } }), []);
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
            <HStack justify="space-between" align="end" gap="3" rowGap="2" mb="3" wrap="wrap">
                <TableHeading nav={nav}>
                    <Heading
                        as="h4" fontSize={{ base: 'lg', sm: 'xl' }} lineHeight="1.2" whiteSpace="nowrap"
                        title={`${count.toLocaleString()} of ${rowData.length.toLocaleString()}`}
                    >
                        {title} <Text as="span" color="fg.muted" fontWeight="normal">({count.toLocaleString()})</Text>
                    </Heading>
                </TableHeading>
            </HStack>
            <Separator borderColor="border" mb="4" />
            {/* every filter in one row: the type toggle and any toolbar (Score / PUMBILITY) together, phones
                included, then the stage-breaks box (on a line of its own under them if there's no room) */}
            <HStack gap={{ base: '2', sm: '3' }} mb="4" align="start">
                <FilterButtons
                    value={type} options={types}
                    onChange={onTypeChange ? (next) => { setType(next); onTypeChange(next); } : refilter(setType)}
                />
                {/* on the right, together; the box goes under the toolbar when they don't fit side by side */}
                <HStack flex="1" justify="end" gap="3" rowGap="2" wrap="wrap" minH={FILTER_STYLE.h}>
                    {typeof toolbar === 'function' ? toolbar(type) : toolbar}
                    {failedToggle && (
                        <Checkbox.Root
                            size="xs" colorPalette="phx2" checked={failed} onCheckedChange={(e) => refilter(setFailed)(!!e.checked)}
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label fontSize="xs" color="fg.muted" fontWeight="normal" ms="1.5" whiteSpace="nowrap">Stage breaks</Checkbox.Label>
                        </Checkbox.Root>
                    )}
                </HStack>
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

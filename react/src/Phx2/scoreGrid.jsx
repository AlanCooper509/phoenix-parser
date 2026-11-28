import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Box, Checkbox, Heading, HStack, Image, Separator, Text } from '@chakra-ui/react';

import { chartBallImg, gradeImg, plateImg, songImg } from '../Helpers/assets';

import { GRADES, gradeLabel, gradeRank, isCleared, PLATE_NAMES } from './pumbility';
import { ChartBadge, SMALL_PHONE } from './shared';
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

// the song's jacket from the cell's left edge, easing out under its name (so phones, too narrow for the art
// beside the name, still have it)
const JACKET_FADE = 'linear-gradient(to right, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.6) 30%, rgba(0, 0, 0, 0.3) 60%, rgba(0, 0, 0, 0.1) 85%, transparent 100%)';

function SongCell({ data }) {
    if (data.jacket) {
        return (
            <Box position="relative" h="full" display="flex" alignItems="center">
                <Box
                    // the row's full height, a little in from the cell's left edge, rounded, so it sits in the row as a soft tile rather than a hard block
                    position="absolute" top="0" bottom="0" left="calc(4px - var(--ag-cell-horizontal-padding))" borderRadius="md"
                    // the whole fade within the cell, however narrow (phones): up to 216px, from near the cell's edge
                    w="calc(100% + var(--ag-cell-horizontal-padding) - 4px)" maxW="216px"
                    bgImage={`url(${songImg('phx2', data.jacket)})`} bgSize="cover" bgPosition="center" opacity="0.6"
                    css={{ maskImage: JACKET_FADE, WebkitMaskImage: JACKET_FADE }}
                />
                <Text position="relative" truncate title={data.name} textShadow="0 1px 3px rgba(0, 0, 0, 0.9)" fontWeight="medium">{data.name}</Text>
            </Box>
        );
    }
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
    filterOptions: ['equals', 'notEqual', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual'],
};
const SCORE_FILTER = { ...NUMBER_FILTER, defaultOption: 'greaterThanOrEqual' };
const FILTER_OPERATORS = [
    ['equals', '='], ['notEqual', '≠'], ['greaterThan', '>'], ['greaterThanOrEqual', '≥'],
    ['lessThan', '<'], ['lessThanOrEqual', '≤'],
];
const OPERATOR_NAMES = {
    equals: 'Equal to', notEqual: 'Not equal to', greaterThan: 'Greater than',
    greaterThanOrEqual: 'Greater than or equal to', lessThan: 'Less than', lessThanOrEqual: 'Less than or equal to',
};

// The filter under a number column (Score, Points, PB): an operator (≥ to start) and the value, in the
// table's own style; `label` names the column
function ValueFloatingFilter({ label = 'Score', ...props }, ref) {
    const [operator, setOperator] = useState('greaterThanOrEqual');
    const [value, setValue] = useState('');

    useImperativeHandle(ref, () => ({
        onParentModelChanged(model) {
            setOperator(model?.type || 'greaterThanOrEqual');
            setValue(model?.filter == null ? '' : String(model.filter));
        },
    }));

    const update = (nextOperator, nextValue) => {
        setOperator(nextOperator);
        setValue(nextValue);
        const parsed = nextValue.trim().replace(/,/g, '');
        const filterValue = parsed === '' || !Number.isFinite(Number(parsed)) ? null : Number(parsed);
        props.parentFilterInstance((filter) => filter.onFloatingFilterChanged(nextOperator, filterValue));
    };

    return (
        <div className={`phx2-grid-floating-filter${value === '' ? '' : ' phx2-grid-filter-active'}`}>
            <select
                className="phx2-grid-filter-operator" aria-label={`${label} filter operator`} title={OPERATOR_NAMES[operator]}
                value={operator} onChange={(event) => (value === '' ? setOperator(event.target.value) : update(event.target.value, value))}
            >
                {FILTER_OPERATORS.map(([type, symbol]) => <option key={type} value={type}>{symbol}</option>)}
            </select>
            <input
                className="phx2-grid-filter-value" type="text" inputMode="decimal" aria-label={`Filter ${label.toLowerCase()}`}
                placeholder={label} value={value} onChange={(event) => update(operator, event.target.value)}
            />
        </div>
    );
}
const ValueFloatingFilterComponent = forwardRef(ValueFloatingFilter);

const RankFloatingFilter = forwardRef(function RankFloatingFilter({ labels, label, ...props }, ref) {
    const [operator, setOperator] = useState('greaterThanOrEqual');
    const [value, setValue] = useState('');

    useImperativeHandle(ref, () => ({
        onParentModelChanged(model) {
            setOperator(model?.type || 'greaterThanOrEqual');
            setValue(model?.filter == null ? '' : String(model.filter));
        },
    }), [labels]);

    const update = (nextOperator, nextValue) => {
        setOperator(nextOperator);
        setValue(nextValue);
        const rank = nextValue === '' ? null : Number(nextValue);
        const filterValue = Number.isInteger(rank) ? labels[rank] : null;
        props.parentFilterInstance((filter) => filter.onFloatingFilterChanged(nextOperator, filterValue));
    };

    return (
        <div className={`phx2-grid-floating-filter phx2-grid-rank-filter phx2-grid-rank-filter-${label.toLowerCase()}${value === '' ? '' : ' phx2-grid-filter-active'}`}>
            <select
                className="phx2-grid-filter-operator" aria-label={`${label} filter operator`} title={OPERATOR_NAMES[operator]}
                value={operator} onChange={(event) => (value === '' ? setOperator(event.target.value) : update(event.target.value, value))}
            >
                {FILTER_OPERATORS.map(([type, symbol]) => <option key={type} value={type}>{symbol}</option>)}
            </select>
            <select
                className="phx2-grid-filter-value" aria-label={`Filter ${label.toLowerCase()}`} title={`Choose a ${label.toLowerCase()}`}
                value={value} onChange={(event) => update(operator, event.target.value)}
            >
                <option value="">Any</option>
                {labels.map((option, rank) => ({ option, rank })).reverse().map(({ option, rank }) => (
                    <option key={option} value={rank}>{option}</option>
                ))}
            </select>
        </div>
    );
});

export const NUMBER_FILTER_COLUMN = { filter: 'agNumberColumnFilter', floatingFilter: true, filterParams: NUMBER_FILTER };
const TEXT_FILTER = {
    filterOptions: ['contains', 'notContains', 'equals', 'notEqual', 'startsWith', 'endsWith'],
};

// Grades and plates filter by rank, as players think of them ("below AA", "PG or better"): compared in
// order, using their names in the full filter and the finite dropdown values in the floating filter.
function rankFilter(labels) {
    const ranks = Object.fromEntries(labels.map((label, i) => [label.toUpperCase(), i]));
    return {
        filterOptions: FILTER_OPERATORS.map(([type]) => type),
        defaultOption: 'greaterThanOrEqual',
        allowedCharPattern: 'A-Za-z\\+',
        numberParser: (text) => (Number.isInteger(text) ? text : ranks[text?.trim().toUpperCase()] ?? null),
        numberFormatter: (rank) => labels[rank] ?? null,
    };
}

// ---- columns

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
    headerName: 'Song', field: 'name', flex: 1, minWidth: 76, cellRenderer: SongCell,
    filter: 'agTextColumnFilter', floatingFilter: true, filterParams: TEXT_FILTER,
};
export const GRADE_COLUMN = {
    colId: 'grade', headerName: 'Grade', field: 'gradeText', width: 108, cellRenderer: GradeCell, comparator: comparing(byScore),
    // right-aligned like its cells, so the grade sits by the plate
    headerClass: 'ag-right-aligned-header phx2-grid-near-next', cellClass: 'phx2-grid-near-next',
    // by rank: a fail counts as the grade it reached; a STAGE BREAK (no grade) never matches
    filter: 'agNumberColumnFilter', floatingFilter: true, filterValueGetter: ({ data }) => gradeRank(data.grade),
    filterParams: rankFilter(GRADES.map(([, label]) => label)),
    floatingFilterComponent: RankFloatingFilter,
    floatingFilterComponentParams: { label: 'Grade', labels: GRADES.map(([, label]) => label), suppressFilterButton: true },
};
export const PLATE_COLUMN = {
    colId: 'plate', headerName: 'Plate', field: 'plate', width: 84, cellRenderer: PlateCell,
    comparator: comparing((a, b) => (PLATES.indexOf(a.plate) - PLATES.indexOf(b.plate)) || byScore(a, b)),
    // by rank, RG to PG: only cleared plays have a plate
    filter: 'agNumberColumnFilter', floatingFilter: true,
    filterValueGetter: ({ data }) => (data.cleared && data.plate ? PLATES.indexOf(data.plate) : null),
    filterParams: rankFilter(PLATES.map((plate) => plate.toUpperCase())),
    floatingFilterComponent: RankFloatingFilter,
    floatingFilterComponentParams: { label: 'Plate', labels: PLATES.map((plate) => plate.toUpperCase()), suppressFilterButton: true },
};
// a number column's filter, as Score's: an operator and a value (`label` names it), at least the value to start
export const valueFilterColumn = (label) => ({
    ...NUMBER_FILTER_COLUMN,
    filterParams: SCORE_FILTER,
    floatingFilterComponent: ValueFloatingFilterComponent,
    floatingFilterComponentParams: { suppressFilterButton: true, label },
});

export const SCORE_COLUMN = {
    colId: 'score', headerName: 'Score', field: 'score', width: 120, cellRenderer: ScoreCell, comparator: comparing(byScore),
    ...valueFilterColumn('Score'),
};

const DEFAULT_COLUMN = { sortable: true, suppressMenu: true, resizable: false };

// Below this grid width (phones) the grid goes compact: smaller text, padding, images and rows
// (.phx2-grid-compact in Phx2.css), and these columns narrower, with their filters tightened to match, so
// the song, level, grade, plate and score fit without scrolling sideways. Columns not in a grid are skipped.
const COMPACT_WIDTH = 600;
const COMPACT_COLUMNS = { levelNumber: 42, grade: 62, plate: 48, score: 70, scorePlayed: 74, pumbility: 70, rank: 28, points: 84 };
// narrower still below this grid width (320px phones), just fitting what's in them, as the columns above
// and the song's minimum come to more than that; their filters hide the operator
const TINY_WIDTH = 310;
const TINY_COLUMNS = { levelNumber: 38, grade: 48, plate: 44, score: 60, scorePlayed: 62, pumbility: 60, rank: 24, points: 50 };
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
            width: (width < TINY_WIDTH && TINY_COLUMNS[id]) || (compact && COMPACT_COLUMNS[id]) || colDef.width,
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
    const fold = moreFold;
    // measured before the grid first draws, so it starts in the right layout (no flash of the wide one
    // on phones); null until then
    const box = useRef(null);
    const [width, setWidth] = useState(null);
    useLayoutEffect(() => {
        setWidth(box.current.clientWidth);
    }, []);
    const [compact, setCompact] = useState(false);
    const [tiny, setTiny] = useState(false);
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
            setTiny(width < TINY_WIDTH);
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
        setTiny(clientWidth < TINY_WIDTH);
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
        <Box ref={box} className={`ag-theme-quartz-dark phx2-grid${compact ? ' phx2-grid-compact' : ''}${tiny ? ' phx2-grid-tiny' : ''}`} w="full">
            {startColumns && (
                <AgGridReact
                    ref={ref}
                    columnDefs={startColumns}
                    defaultColDef={DEFAULT_COLUMN}
                    // room for the 40px step balls (smaller when compact)
                    rowHeight={compact ? 44 : 56}
                    domLayout="autoHeight"
                    onGridSizeChanged={fitColumns}
                    onFirstDataRendered={fitColumns}
                    // columns can be dragged into another order (as on Phoenix 1), but not off the grid
                    suppressDragLeaveHidesColumns
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
        <HStack gap={{ base: '2', sm: '4' }} align="baseline">
            {nav.before}
            {children}
            {nav.after}
        </HStack>
    );
}

// ---- the table around the grid, the same on Best Scores, Recently Played and the best 50

const TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles'], ['c', 'Co-op']];

// 'all' is every row, otherwise the one type
export function isOfType(row, type) {
    return type === 'all' || row.type === type;
}

// narrower than any phone: too narrow for a table's heading and its controls to share a line
const BELOW_PHONES = '@media screen and (max-width: 319.98px)';

// `long`, or `short` below md, where the row the two share a line with has less room
function ShortBelowMd({ long, short }) {
    return (
        <>
            <Box as="span" display={{ base: 'none', md: 'inline' }}>{long}</Box>
            <Box as="span" display={{ base: 'inline', md: 'none' }}>{short}</Box>
        </>
    );
}

// `title` (`shortTitle` on smaller screens) with the count of rows passing every filter (as on Phoenix 1) and, with `failedToggle`, a
// small checkbox for fails and STAGE BREAKs (rows that aren't clears; ticked to start with
// `failedShown`), a divider, then
// the type buttons (and `toolbar`, on the right) right over the grid. The buttons filter the rows by
// type (`types` sets them); with `onTypeChange`, they call it instead, for the parent to swap the rows.
// With `type`, a control of the parent's picks the type and there are no buttons here (Overview's score
// tables). `toolbar` can also be a function of the type picked. `nav` ({ before, after }) goes either side of the
// heading (Overview's other score view). `onCountChange` hears the rows' count. `footer` goes under it; `ref` reaches the grid's api. Other props go to ScoreGrid.
export const ScoreTable = forwardRef(function ScoreTable({
    title, shortTitle, nav, toolbar, failedToggle = false, failedShown = false, footer, rowData, types = TYPES, onTypeChange, type: parentType, onCountChange, ...props
}, ref) {
    const grid = useRef(null);
    // read through to the grid when used: it mounts a render after this table (once ScoreGrid has
    // measured its width), so it isn't there yet when the handle is made
    useImperativeHandle(ref, () => ({ get api() { return grid.current?.api; } }), []);
    const [ownType, setType] = useState('all');
    const type = parentType ?? ownType;
    const [failed, setFailed] = useState(!failedToggle || failedShown);
    // starts as what the grid will show, so the heading doesn't flash the unfiltered count first
    const [count, setCount] = useState(() => rowData.filter((row) => (
        (failed || row.cleared) && (onTypeChange || isOfType(row, type))
    )).length);

    const filters = useRef({ type, failed });
    filters.current = { type, failed };
    // with onTypeChange the rows already are the type picked
    const filtersType = !onTypeChange;
    const isExternalFilterPresent = useCallback(() => (filtersType && filters.current.type !== 'all') || !filters.current.failed, [filtersType]);
    const doesExternalFilterPass = useCallback(({ data }) => (
        (!filtersType || isOfType(data, filters.current.type)) && (filters.current.failed || data.cleared)
    ), [filtersType]);
    const refilter = (set) => (next) => {
        set(next);
        // after React has applied the new value to filters.current
        setTimeout(() => grid.current?.api?.onFilterChanged());
    };
    useEffect(() => {
        grid.current?.api?.onFilterChanged();
    }, [parentType]);
    useEffect(() => {
        onCountChange?.(count);
    }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

    const inline = parentType !== undefined;
    // on the right, together
    const controls = (
        <HStack
            justify="end" gap={{ base: '2', sm: '3' }} wrap="nowrap" minH={FILTER_STYLE.h}
            css={inline ? { [SMALL_PHONE]: { '& button': { paddingInline: '4px' } } } : undefined}
        >
            {failedToggle && (
                // the label on the box's left, so the box sits by the toolbar, or the row's end; on the smallest
                // phones just the box, with its name on hover and for screen readers
                <Checkbox.Root
                    size="xs" colorPalette="phx2" title="Stage breaks" checked={failed} onCheckedChange={(e) => refilter(setFailed)(!!e.checked)}
                >
                    <Checkbox.HiddenInput aria-label="Stage breaks" />
                    <Checkbox.Label
                        fontSize="xs" color="fg.muted" fontWeight="normal" me="1.5" whiteSpace="nowrap"
                        css={inline ? { [SMALL_PHONE]: { display: 'none' } } : undefined}
                    >
                        <ShortBelowMd long="Stage breaks" short="Breaks" />
                    </Checkbox.Label>
                    <Checkbox.Control />
                </Checkbox.Root>
            )}
            {typeof toolbar === 'function' ? toolbar(type) : toolbar}
        </HStack>
    );

    return (
        <Box>
            {/* with the type picked elsewhere (Overview's tables), the heading's row also holds the controls, on
                the right: on one line on any phone, whatever the counts, so its height never changes, with
                shorter names below md and a smaller heading on phones; only narrower than those do the
                controls take a line of their own */}
            <HStack
                justify="space-between" align={inline ? 'center' : 'end'} gap={inline ? { base: '2', sm: '3' } : '3'} rowGap="2" mb="3" wrap={inline ? 'nowrap' : 'wrap'}
                css={inline ? { [BELOW_PHONES]: { flexWrap: 'wrap' } } : undefined}
            >
                <Box display={inline ? 'block' : 'contents'} minW="0" overflow={inline ? 'hidden' : undefined}>
                    <TableHeading nav={nav}>
                        <Heading
                            as="h4" fontSize={inline ? { base: 'md', sm: 'lg', md: 'xl' } : { base: 'lg', sm: 'xl' }} lineHeight="1.2" whiteSpace="nowrap"
                            title={`${count.toLocaleString()} of ${rowData.length.toLocaleString()}`}
                        >
                            {shortTitle ? <ShortBelowMd long={title} short={shortTitle} /> : title}{' '}
                            <Text as="span" color="fg.muted" fontWeight="normal">({count.toLocaleString()})</Text>
                        </Heading>
                    </TableHeading>
                </Box>
                {inline && <Box flexShrink="0" ms="auto" css={{ [BELOW_PHONES]: { width: '100%' } }}>{controls}</Box>}
            </HStack>
            <Separator borderColor="border" mb="4" />
            {!inline && (
                // every filter in one row: the type toggle and any toolbar together, phones included
                <HStack gap={{ base: '2', sm: '3' }} mb="4" align="start">
                    <FilterButtons
                        value={type} options={types}
                        onChange={onTypeChange ? (next) => { setType(next); onTypeChange(next); } : refilter(setType)}
                    />
                    <Box flex="1">{controls}</Box>
                </HStack>
            )}
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

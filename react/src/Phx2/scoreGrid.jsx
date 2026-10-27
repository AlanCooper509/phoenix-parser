import { forwardRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { Box, HStack, Text } from '@chakra-ui/react';

import { gradeLabel, isCleared, PLATE_NAMES } from './pumbility';
import { ChartBadge, Jacket } from './shared';

// The ag-grid behind Best Scores and Recently Played: its dark theme recolored to Phoenix 2 (.phx2-grid
// in Phx2.css), the cells and sorting both share, and columns that fold away on narrow screens.

// a score or play as a grid row: a level number to sort and filter by (co-op charts go by player
// count, "n2" as synced, as their C2 badge shows), its grade as text, and whether it was cleared
export function gridRow(score) {
    return {
        ...score,
        levelNumber: Number(String(score.level).replace(/^n/, '')) || null,
        gradeText: score.stageBreak || !score.grade ? 'Stage break' : gradeLabel(score.grade),
        cleared: isCleared(score),
    };
}

// ---- cells (outside components, so re-renders don't remount every cell)

const middle = { h: 'full', align: 'center' };

function LevelCell({ data }) {
    return <HStack {...middle}><ChartBadge type={data.type} level={data.level} /></HStack>;
}

function SongCell({ data }) {
    return (
        <HStack {...middle} gap="3" minW="0">
            <Jacket jacket={data.jacket} w="56px" />
            <Text truncate title={data.name}>{data.name}</Text>
        </HStack>
    );
}

function GradeCell({ data }) {
    if (data.stageBreak || !data.grade) {
        return <Text color="fg.muted">Stage break</Text>;
    }
    return <Text color={data.cleared ? 'fg' : 'fg.muted'}>{gradeLabel(data.grade)}{!data.cleared && ' (failed)'}</Text>;
}

function PlateCell({ data }) {
    return data.cleared && data.plate
        ? <Text title={PLATE_NAMES[data.plate]}>{data.plate.toUpperCase()}</Text>
        : <Text color="fg.subtle">-</Text>;
}

function ScoreCell({ data }) {
    return <Text color={data.cleared ? 'fg' : 'fg.muted'} fontVariantNumeric="tabular-nums">{data.score?.toLocaleString() ?? '-'}</Text>;
}

// ---- sorting: grades by score (as Phoenix 1), plates in plate order, ties by level

const PLATES = ['rg', 'fg', 'tg', 'mg', 'sg', 'eg', 'ug', 'pg'];
const byLevel = (a, b) => (a.levelNumber ?? -1) - (b.levelNumber ?? -1);
const byScore = (a, b) => ((a.score ?? -1) - (b.score ?? -1)) || byLevel(a, b);
export const comparing = (compare) => (valueA, valueB, nodeA, nodeB) => compare(nodeA.data, nodeB.data);

// ---- columns

export const LEVEL_COLUMN = {
    headerName: 'Level', field: 'levelNumber', width: 96, cellRenderer: LevelCell,
    filter: 'agNumberColumnFilter', floatingFilter: true,
};
export const SONG_COLUMN = {
    headerName: 'Song', field: 'name', flex: 1, minWidth: 180, cellRenderer: SongCell,
    filter: 'agTextColumnFilter', floatingFilter: true,
};
export const GRADE_COLUMN = {
    colId: 'grade', headerName: 'Grade', field: 'gradeText', width: 120, cellRenderer: GradeCell, comparator: comparing(byScore),
    filter: 'agTextColumnFilter', floatingFilter: true, filterParams: { filterOptions: ['equals', 'startsWith', 'contains'], defaultOption: 'equals' },
};
export const PLATE_COLUMN = {
    colId: 'plate', headerName: 'Plate', field: 'plate', width: 90, cellRenderer: PlateCell,
    comparator: comparing((a, b) => (PLATES.indexOf(a.plate) - PLATES.indexOf(b.plate)) || byScore(a, b)),
};
export const SCORE_COLUMN = {
    colId: 'score', headerName: 'Score', field: 'score', width: 120, cellRenderer: ScoreCell, comparator: comparing(byScore),
    filter: 'agNumberColumnFilter', floatingFilter: true,
};

const DEFAULT_COLUMN = { sortable: true, suppressMovable: true, suppressMenu: true, resizable: false };

// The themed grid. `fold`: [[width, colIds], ...], columns hidden while the grid is narrower than
// that width, so the song keeps room. Other props go to AgGridReact.
const ScoreGrid = forwardRef(function ScoreGrid({ fold = [], ...props }, ref) {
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
                rowHeight={52}
                domLayout="autoHeight"
                onGridSizeChanged={fitColumns}
                onFirstDataRendered={fitColumns}
                suppressCellFocus
                {...props}
            />
        </Box>
    );
});

export default ScoreGrid;

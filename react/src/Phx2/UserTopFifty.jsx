import { useMemo } from 'react';
import { HStack, Image, Text } from '@chakra-ui/react';

import {
    GRADE_COLUMN, gridRow, LEVEL_COLUMN, PLATE_COLUMN, ScoreTable, SONG_COLUMN, valueFilterColumn,
} from './scoreGrid';
import { DOUBLE_MILESTONES, SINGLE_MILESTONES } from './pumbility';
import { formatPumbility, tierOfPoints, titleOfPoints } from './shared';

// The charts that make up a PUMBILITY, laid out like Best Scores: rank, jacket, level, song, grade,
// plate and points, highest first. `type` (the PUMBILITY tab's All / Singles / Doubles) picks the best 50:
// All is the total's (as piugame lists it); Singles and Doubles are those behind singles or doubles PUMBILITY.
function RankCell({ data }) {
    return <Text color="fg.muted" fontVariantNumeric="tabular-nums">{data.rank}</Text>;
}
// The points, at the cell's right, after what fifty charts like it would add up to: on All the tier,
// its icon (380 x 50 = 19,000: ALEXANDRITE Lv.1), the points in its color; on Singles or Doubles (`milestones`)
// the title, its level in brackets ([6] for [S] EXPERT LV.6, [M] for MASTER; titles have no icons), the points
// and level in its color
function PointsCell({ data, milestones }) {
    const reach = milestones ? titleOfPoints(data.points, milestones) : tierOfPoints(data.points);
    const title = reach ? `${formatPumbility(data.points)} × 50 = ${formatPumbility(data.points * 50)}: ${reach.name}` : undefined;
    const level = milestones && reach && (/LV\.(\d+)/.exec(reach.name)?.[1] ?? 'M');
    return (
        // the icon's full size even on phones, where the number in it would otherwise be too small to read
        <HStack gap="1" h="full" justify="end" title={title}>
            {milestones
                ? level && <Text fontSize="xs" fontWeight="semibold" color={reach.color} whiteSpace="nowrap">[{level}]</Text>
                : reach && <Image src={reach.icon} alt={reach.name} boxSize="30px" my="-4px" flexShrink="0" />}
            <Text fontVariantNumeric="tabular-nums" fontWeight="semibold" color={reach?.color ?? 'fg'} whiteSpace="nowrap">{formatPumbility(data.points)}</Text>
        </HStack>
    );
}
const TITLE_MILESTONES = { s: SINGLE_MILESTONES, d: DOUBLE_MILESTONES };
const topFiftyColumns = (type) => [
    // not sortable: the rows come in rank order, and clearing another column's sort returns to it
    { headerName: '#', field: 'rank', width: 48, minWidth: 24, cellRenderer: RankCell, sortable: false },
    LEVEL_COLUMN,
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    {
        headerName: 'Points', field: 'points', width: 130, cellRenderer: PointsCell, cellRendererParams: { milestones: TITLE_MILESTONES[type] },
        headerClass: 'phx2-grid-center', ...valueFilterColumn('Points'),
    },
];

// the best 50 counting charts of `type` (or of singles and doubles alike), as grid rows
function topFifty(scores, values, type) {
    return scores
        .filter((score) => (type === 'all' || score.type === type) && values.get(score) > 0)
        .sort((a, b) => values.get(b) - values.get(a))
        .slice(0, 50)
        .map((score, i) => ({ ...gridRow(score), rank: i + 1, points: values.get(score) }));
}

function UserTopFifty({ scores, summary, type, title, nav }) {
    const rows = useMemo(() => topFifty(scores, summary.valueOf, type), [scores, summary, type]);
    const columns = useMemo(() => topFiftyColumns(type), [type]);
    return (
        <ScoreTable
            // a fresh grid per type: its rows are a different best 50
            key={type} title={title} nav={nav} rowData={rows} columnDefs={columns} type={type}
            footer={rows.length < 50 && (
                <Text fontSize="sm" color="fg.muted" mt="3">{rows.length} of 50 so far: clear more charts to fill the rest.</Text>
            )}
        />
    );
}

export default UserTopFifty;

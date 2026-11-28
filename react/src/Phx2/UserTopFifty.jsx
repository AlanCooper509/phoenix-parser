import { useMemo } from 'react';
import { HStack, Image, Text } from '@chakra-ui/react';

import {
    GRADE_COLUMN, gridRow, LEVEL_COLUMN, NUMBER_FILTER_COLUMN, PLATE_COLUMN, ScoreTable, SONG_COLUMN,
} from './scoreGrid';
import { DOUBLE_MILESTONES, SINGLE_MILESTONES } from './pumbility';
import { formatPumbility, tierOfPoints, titleOfPoints } from './shared';

// The charts that make up a PUMBILITY, laid out like Best Scores: rank, jacket, level, song, grade,
// plate and points, highest first. `type` (the PUMBILITY tab's All / Singles / Doubles) picks the best 50:
// All is the total's (as piugame lists it); Singles and Doubles are those behind singles or doubles PUMBILITY.
function RankCell({ data }) {
    return <Text color="fg.muted" fontVariantNumeric="tabular-nums">{data.rank}</Text>;
}
// The points with what fifty charts like it would add up to: on All the tier, in its color after its icon
// (380 x 50 = 19,000: ALEXANDRITE Lv.1); on Singles or Doubles (`milestones`) the title, the points in its color after its level
// in brackets ([6] for [S] EXPERT LV.6, [M] for MASTER), titles having no icons
function PointsCell({ data, milestones }) {
    if (milestones) {
        const title = titleOfPoints(data.points, milestones);
        const level = title && (/LV\.(\d+)/.exec(title.name)?.[1] ?? 'M');
        return (
            <Text
                fontVariantNumeric="tabular-nums" fontWeight="semibold" color={title?.color ?? 'fg'} whiteSpace="nowrap"
                title={title ? `${formatPumbility(data.points)} × 50 = ${formatPumbility(data.points * 50)}: ${title.name}` : undefined}
            >
                {level && <Text as="span" fontSize="xs" me="1">[{level}]</Text>}
                {formatPumbility(data.points)}
            </Text>
        );
    }
    const tier = tierOfPoints(data.points);
    return (
        // the icon's full size even on phones, where the number in it would otherwise be too small to read
        <HStack gap="1" h="full" justify="end">
            {tier && (
                <Image
                    src={tier.icon} alt={tier.name} title={`${formatPumbility(data.points)} × 50 = ${formatPumbility(data.points * 50)}: ${tier.name}`}
                    boxSize="30px" my="-4px" flexShrink="0"
                />
            )}
            <Text fontVariantNumeric="tabular-nums" fontWeight="semibold" color={tier?.color ?? 'fg'}>{formatPumbility(data.points)}</Text>
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
        headerClass: 'ag-right-aligned-header', ...NUMBER_FILTER_COLUMN,
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

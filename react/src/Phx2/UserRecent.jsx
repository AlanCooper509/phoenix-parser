import { useMemo } from 'react';
import { EmptyState, Text } from '@chakra-ui/react';
import { LuHistory } from 'react-icons/lu';

import ScoreGrid, { GRADE_COLUMN, gridRow, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, SONG_COLUMN } from './scoreGrid';
import { timeAgo } from './shared';

// Recently Played: the player's last 50 plays as piugame lists them, in the same grid as Best
// Scores (newest first), each with its own score, grade and plate, judgments, and when it was played.

const JUDGMENTS = [['perfect', 'Perfect'], ['great', 'Great'], ['good', 'Good'], ['bad', 'Bad'], ['miss', 'Miss']];
// Grade and Plate fold away below 640px, the judgments below 960px, so the song keeps room
const FOLD = [[640, ['grade', 'plate']], [960, JUDGMENTS.map(([key]) => key)]];

function PlayedCell({ data }) {
    return (
        <Text color="fg.muted" title={data.date && new Date(data.date).toLocaleString()}>
            {data.time ? timeAgo(data.time / 1000) : '-'}
        </Text>
    );
}

const COLUMNS = [
    LEVEL_COLUMN,
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    SCORE_COLUMN,
    ...JUDGMENTS.map(([key, label]) => ({
        colId: key, headerName: label, valueGetter: ({ data }) => data.judgments?.[key] ?? null, width: 84,
        type: 'rightAligned', cellStyle: { color: 'var(--ag-secondary-foreground-color)' },
        valueFormatter: ({ value }) => value?.toLocaleString() ?? '-',
    })),
    { headerName: 'Played', field: 'time', width: 110, cellRenderer: PlayedCell, sort: 'desc' },
];

function UserRecent({ recents }) {
    const rows = useMemo(() => recents.map((play) => ({ ...gridRow(play), time: Date.parse(play.date) || null })), [recents]);

    if (!recents.length) {
        return (
            <EmptyState.Root>
                <EmptyState.Content>
                    <EmptyState.Indicator><LuHistory /></EmptyState.Indicator>
                    <EmptyState.Title>No recent plays synced yet</EmptyState.Title>
                    <EmptyState.Description>They'll show here after the next sync.</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState.Root>
        );
    }
    return <ScoreGrid rowData={rows} columnDefs={COLUMNS} fold={FOLD} />;
}

export default UserRecent;

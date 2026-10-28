import { Fragment, useMemo } from 'react';
import { EmptyState, Heading, Text, VStack } from '@chakra-ui/react';
import { LuHistory } from 'react-icons/lu';

import {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, ScoreTable, SONG_COLUMN, TableHeading,
} from './scoreGrid';
import { timeAgo } from './shared';

// Recently Played: the player's last 50 plays as piugame lists them, in the same grid as Best
// Scores (newest first), each with its own score, grade and plate, judgments, and when it was played.

// Perfect / Great / Good / Bad / Miss, in the colors piugame's Recently Played labels them with, but
// Perfect in the in-game judgment's sky cyan (piugame's site uses a deep blue that's hard to read here)
const JUDGMENTS = [
    ['perfect', 'Perfect', '#3dcdf1'], ['great', 'Great', 'rgb(50, 205, 50)'], ['good', 'Good', 'rgb(251, 255, 7)'],
    ['bad', 'Bad', 'rgb(204, 0, 255)'], ['miss', 'Miss', 'rgb(255, 0, 0)'],
];
// the judgments fold away below 760px, so the song keeps room; on phones when it was played moves
// under the score (one column for both), so every other column still fits
const FOLD = [[760, ['judgments']], [480, ['score', 'time'], ['scorePlayed']]];

// "1,174 / 16 / 7 / 3 / 12": the order is the usual one, and each count is in its judgment's color
function JudgmentsCell({ data }) {
    if (!data.judgments) {
        return <Text color="fg.subtle">-</Text>;
    }
    return (
        <Text fontVariantNumeric="tabular-nums" whiteSpace="nowrap" textAlign="center" title={JUDGMENTS.map(([key, label]) => `${label} ${data.judgments[key] ?? '-'}`).join(', ')}>
            {JUDGMENTS.map(([key, , color], i) => (
                <Fragment key={key}>
                    {i > 0 && <Text as="span" color="fg.subtle"> / </Text>}
                    <Text as="span" color={color}>{data.judgments[key]?.toLocaleString() ?? '-'}</Text>
                </Fragment>
            ))}
        </Text>
    );
}

// the score with when it was played under it, smaller (phones)
function ScorePlayedCell({ data }) {
    return (
        <VStack gap="0" align="start" justify="center" h="full" lineHeight="1.25">
            <Text color={data.cleared ? 'fg' : 'fg.muted'} fontVariantNumeric="tabular-nums">{data.score?.toLocaleString() ?? '-'}</Text>
            <Text color="fg.subtle" fontSize="11px" title={data.date && new Date(data.date).toLocaleString()}>
                {data.time ? timeAgo(data.time / 1000) : '-'}
            </Text>
        </VStack>
    );
}

function PlayedCell({ data }) {
    return (
        <Text color="fg.muted" title={data.date && new Date(data.date).toLocaleString()}>
            {data.time ? timeAgo(data.time / 1000) : '-'}
        </Text>
    );
}

const COLUMNS = [
    JACKET_COLUMN,
    LEVEL_COLUMN,
    SONG_COLUMN,
    GRADE_COLUMN,
    PLATE_COLUMN,
    SCORE_COLUMN,
    // sorts by perfects
    {
        colId: 'judgments', headerName: 'Judgments', valueGetter: ({ data }) => data.judgments?.perfect ?? null, width: 210,
        cellRenderer: JudgmentsCell, headerClass: 'phx2-grid-center',
    },
    { headerName: 'Played', field: 'time', width: 110, cellRenderer: PlayedCell, sort: 'desc' },
    // Score and Played in one, on phones (FOLD); sorts by score
    { ...SCORE_COLUMN, colId: 'scorePlayed', cellRenderer: ScorePlayedCell, hide: true },
];

function UserRecent({ recents, nav }) {
    const rows = useMemo(() => recents.map((play) => ({ ...gridRow(play), time: Date.parse(play.date) || null })), [recents]);

    if (!recents.length) {
        return (
            <>
                <TableHeading nav={nav}>
                    <Heading as="h4" fontSize={{ base: 'lg', sm: 'xl' }} lineHeight="1.2" whiteSpace="nowrap">Recently Played</Heading>
                </TableHeading>
                <EmptyState.Root>
                    <EmptyState.Content>
                        <EmptyState.Indicator><LuHistory /></EmptyState.Indicator>
                        <EmptyState.Title>No recent plays synced yet</EmptyState.Title>
                        <EmptyState.Description>They'll show here after the next sync.</EmptyState.Description>
                    </EmptyState.Content>
                </EmptyState.Root>
            </>
        );
    }
    // laid out like Best Scores, but showing fails and STAGE BREAKs to start: they're plays too
    return <ScoreTable title="Recently Played" nav={nav} failedToggle failedShown rowData={rows} columnDefs={COLUMNS} fold={FOLD} />;
}

export default UserRecent;

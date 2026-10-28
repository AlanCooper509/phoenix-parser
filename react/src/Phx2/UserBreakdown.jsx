import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Center, Collapsible, Heading, HStack, NativeSelect, Separator, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

import getChartsForLevel from '../API/chartlevel';
import { userPath } from '../Helpers/paths';
import { isCleared } from './pumbility';
import ScoreGrid, { GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, SONG_COLUMN } from './scoreGrid';
import { FilterButtons } from './UserOverview';

// Breakdown: one level at a time (as on the Phoenix (1) Breakdown tab): how many of its charts are
// cleared, how those clears spread across grades, and every chart at the level, remaining ones first.
// The level is in the URL: /breakdown/25 (singles and doubles), /breakdown/s25, /breakdown/d25,
// /breakdown/c2 (co-op for two).

const TYPES = [['all', 'All'], ['s', 'Singles'], ['d', 'Doubles'], ['c', 'Co-op']];
const COOP_PLAYERS = [2, 3, 4, 5];

// "s25" -> { type: 's', level: 25 }; "25" -> both types; "c2" -> co-op for two
function parseView(view) {
    const match = /^([sdc]?)(\d+)$/.exec(view || '');
    return match ? { type: match[1] || 'all', level: Number(match[2]) } : null;
}
function viewOf(type, level) {
    return `${type === 'all' ? '' : type}${level}`;
}

// the chart list's key for a level ("07"), or "coop"
const listKey = (type, level) => (type === 'c' ? 'coop' : String(level).padStart(2, '0'));
// a chart or score's identity across the chart list and the synced scores
const chartKey = (jacket, type, level) => `${jacket}|${type}|${level}`;

// the highest level with a clear (of singles and doubles alike), to start on
function highestCleared(scores) {
    return scores.filter((s) => (s.type === 's' || s.type === 'd') && isCleared(s))
        .reduce((best, s) => Math.max(best, Number(s.level)), 0) || null;
}

// Grade groups as on Phoenix 1's breakdown chart, highest first, colored like the grades themselves
const GRADE_GROUPS = [
    ['SSS / SSS+', ['sss', 'sss_p'], '#6bd8ff'],
    ['SS / SS+', ['ss', 'ss_p'], '#efbf00'],
    ['S / S+', ['s', 's_p'], '#efbf00'],
    ['AAA / AAA+', ['aaa', 'aaa_p'], '#d9d7d4'],
    ['AA / AA+', ['aa', 'aa_p'], '#c47a3c'],
    ['A / A+', ['a', 'a_p'], '#c47a3c'],
    ['B and below', ['b', 'c', 'd', 'f'], '#13aa7d'],
].reverse();
const TEXT = '#a1a1aa';
const GRID = 'rgba(255, 255, 255, 0.06)';

function GradeChart({ rows }) {
    // rebuilt only when the rows change, so re-renders don't redraw the chart
    const data = useMemo(() => {
        const clears = rows.filter((row) => row.cleared);
        const counts = GRADE_GROUPS.map(([, grades]) => clears.filter((row) => grades.includes(row.grade)).length);
        return {
            labels: GRADE_GROUPS.map(([label]) => label),
            datasets: [{ data: counts, backgroundColor: GRADE_GROUPS.map(([, , color]) => color), borderRadius: 3 }],
        };
    }, [rows]);
    const options = useMemo(() => ({
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (item) => ` ${item.formattedValue} ${item.raw === 1 ? 'clear' : 'clears'}` } },
        },
        scales: {
            x: { ticks: { color: TEXT, autoSkip: false, maxRotation: 0, font: (c) => ({ size: c.chart.width < 500 ? 9 : 12 }) }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: TEXT, precision: 0 }, grid: { color: GRID } },
        },
    }), []);
    return (
        <Box h={{ base: '220px', md: '280px' }}>
            <Chart type="bar" data={data} options={options} />
        </Box>
    );
}

function LevelPicker({ type, level, levels, onChange }) {
    return (
        <HStack gap="2" fontSize="sm" color="fg.muted">
            <Text>{type === 'c' ? 'Players' : 'Level'}</Text>
            <NativeSelect.Root size="sm" w="auto">
                <NativeSelect.Field
                    aria-label={type === 'c' ? 'Co-op players' : 'Level'} value={level} onChange={(e) => onChange(Number(e.target.value))}
                    borderColor="phx2.emphasized" ps="2.5" pe="7"
                >
                    {levels.map((l) => <option key={l} value={l}>{type === 'c' ? `x${l}` : `Lv.${l}`}</option>)}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
            </NativeSelect.Root>
        </HStack>
    );
}

const COLUMNS = [JACKET_COLUMN, LEVEL_COLUMN, SONG_COLUMN, GRADE_COLUMN, PLATE_COLUMN, { ...SCORE_COLUMN, sort: 'desc' }];

// a collapsible table of charts under a heading with its count (the grid mounts once first opened)
function ChartSection({ title, rows, defaultOpen, empty, gridKey }) {
    return (
        <Collapsible.Root defaultOpen={defaultOpen} lazyMount>
            <Collapsible.Trigger asChild>
                <HStack as="button" gap="2" mb="3" cursor="pointer" textAlign="start" css={{ '&[data-state=open] svg': { transform: 'rotate(180deg)' } }}>
                    <Heading as="h4" size="lg">
                        {title} <Text as="span" color="fg.muted" fontWeight="normal">({rows.length})</Text>
                    </Heading>
                    <Box as={LuChevronDown} color="fg.muted" transition="transform 0.2s" />
                </HStack>
            </Collapsible.Trigger>
            <Collapsible.Content>
                {rows.length > 0 ? (
                    <ScoreGrid key={gridKey} rowData={rows} columnDefs={COLUMNS} />
                ) : (
                    <Text color="fg.muted" mb="3">{empty}</Text>
                )}
            </Collapsible.Content>
        </Collapsible.Root>
    );
}

function UserBreakdown({ name, number, view, scores, counts }) {
    const navigate = useNavigate();
    const start = useMemo(() => highestCleared(scores), [scores]);
    const { type, level } = parseView(view) || { type: 'all', level: start || 20 };
    const show = (nextType, nextLevel) => navigate(userPath('phx2', name, number, `breakdown/${viewOf(nextType, nextLevel)}`));

    // levels with charts of the type picked (co-op: player counts)
    const levels = useMemo(() => {
        if (type === 'c') {
            return COOP_PLAYERS;
        }
        const field = { all: 'total', s: 'singles', d: 'doubles' }[type];
        return Object.entries(counts || {}).filter(([, c]) => c[field] > 0).map(([l]) => Number(l)).filter(Boolean).sort((a, b) => a - b);
    }, [counts, type]);

    // the chart list for the level (or for co-op), fetched once each
    const [lists, setLists] = useState({});
    const key = listKey(type, level);
    useEffect(() => {
        if (!lists[key]) {
            getChartsForLevel('phx2', key)
                .then((list) => setLists((all) => ({ ...all, [key]: list })))
                .catch(() => setLists((all) => ({ ...all, [key]: { error: true } })));
        }
    }, [key, lists]);
    const list = lists[key];

    // every chart at the level with the player's best on it, if any
    const rows = useMemo(() => {
        if (!list || list.error) {
            return [];
        }
        const best = new Map(scores.map((s) => [chartKey(s.jacket, s.type, s.level), s]));
        const charts = type === 'c'
            ? (list[`n${level}`] || [])
            : [...(type !== 'd' ? list.s || [] : []), ...(type !== 's' ? list.d || [] : [])];
        return charts.map((chart) => {
            const jacket = chart.bg_img?.match(/([0-9a-f]{32})/)?.[1];
            const score = best.get(chartKey(jacket, chart.type, chart.level));
            return gridRow(score || { name: chart.name, jacket, type: chart.type, level: chart.level, score: null, grade: null, plate: null, unplayed: true });
        });
    }, [list, scores, type, level]);

    const cleared = rows.filter((row) => row.cleared);
    const average = cleared.length ? Math.round(cleared.reduce((sum, row) => sum + row.score, 0) / cleared.length) : null;
    const levelName = type === 'c' ? `Co-op x${level}` : `${{ all: 'Level', s: 'Single', d: 'Double' }[type]} ${level}`;

    const remaining = rows.filter((row) => !row.cleared);

    return (
        <VStack align="stretch" gap="6">
            <HStack justify="space-between" wrap="wrap" gap="3">
                <FilterButtons
                    value={type} options={TYPES}
                    onChange={(t) => show(t, t === 'c' ? COOP_PLAYERS[0] : (type === 'c' ? start || 20 : level))}
                />
                <LevelPicker type={type} level={level} levels={levels} onChange={(l) => show(type, l)} />
            </HStack>
            <Separator borderColor="border" />
            {!list ? <Center py="10"><Spinner color="phx2.fg" /></Center> : list.error ? (
                <Text color="fg.muted">Couldn't load this level's charts right now.</Text>
            ) : (
                <>
                    <Box>
                        <Heading as="h4" size="lg">
                            {levelName} <Text as="span" color="fg.muted" fontWeight="normal">({cleared.length} of {rows.length} cleared)</Text>
                        </Heading>
                        {/* always a line here, so the page doesn't shift between levels with and without clears */}
                        <Text color="fg.muted" fontSize="sm" mt="1">{average ? `Average clear: ${average.toLocaleString()}` : 'No clears yet'}</Text>
                    </Box>
                    <GradeChart rows={rows} />
                    {/* a fresh grid per level */}
                    <ChartSection title="Remaining" rows={remaining} empty="Every chart here is cleared." gridKey={`${key}|${type}|${level}|remaining`} />
                    <ChartSection title="Cleared" rows={cleared} defaultOpen empty="No clears here yet." gridKey={`${key}|${type}|${level}|cleared`} />
                </>
            )}
        </VStack>
    );
}

export default UserBreakdown;

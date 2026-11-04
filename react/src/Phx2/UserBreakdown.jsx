import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Center, Heading, HStack, Image, NativeSelect, Separator, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

import getChartsForLevel from '../API/chartlevel';
import { userPath } from '../Helpers/paths';
import { GRADES, gradeLabel, isCleared } from './pumbility';
import { chartBallImg, gradeImg, plateImg } from '../Helpers/assets';
import { EASE_OUT_QUART, FILL_TRANSITION, GRADE_COLORS, SMALL_PHONE } from './shared';
import ScoreGrid, {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, SONG_COLUMN, TableHeading, ViewLink,
} from './scoreGrid';
import {
    COOP_HEIGHT, FILTER_STYLE, FilterButtons, HEADING_SIZE, HERO_BAR_MARGIN, HERO_VALUE_STYLE, PANEL_STYLE,
} from './UserOverview';

// Breakdown: one level at a time (as on the Phoenix (1) Breakdown tab): how many of its charts are
// cleared, how those clears spread across grades, and the level's charts, cleared or remaining.
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

// Grade groups as on the Phoenix (1) breakdown chart: a pair of bars each, the grade and its "+"
// side by side (the lowest pair is F / D / C, shown as "-", and B), under the scores the pair spans (Phoenix 2's
// cutoffs, pumbility.js's GRADES), colored like the grades themselves
const GRADE_GROUPS = [
    ['- | B', ['f', 'd', 'c'], ['b'], GRADE_COLORS.b],
    ['A | +', ['a'], ['a_p'], GRADE_COLORS.a],
    ['AA | +', ['aa'], ['aa_p'], GRADE_COLORS.a],
    ['AAA | +', ['aaa'], ['aaa_p'], GRADE_COLORS.aaa],
    ['S | +', ['s'], ['s_p'], GRADE_COLORS.s],
    ['SS | +', ['ss'], ['ss_p'], GRADE_COLORS.s],
    ['SSS | +', ['sss'], ['sss_p'], GRADE_COLORS.sss],
];
const CUTOFF = Object.fromEntries(GRADES.map(([key, , score]) => [key, score]));
const thousands = (score) => (score >= 1000000 ? '1m' : `${Math.round(score / 1000)}k`);
// "(920k ~ 949k)": from the group's lowest grade to just under the next group's
const GROUP_RANGES = GRADE_GROUPS.map(([, grades], i) => {
    const next = GRADE_GROUPS[i + 1];
    const from = Math.min(...grades.map((grade) => CUTOFF[grade]));
    return `(${thousands(from)} ~ ${next ? thousands(CUTOFF[next[1][0]] - 1000) : '1m'})`;
});
// what each bar of a pair holds, for the tooltip
const BAR_NAMES = [GRADE_GROUPS.map(([, grades]) => grades.map(gradeLabel).join(' / ')), GRADE_GROUPS.map(([, , plus]) => plus.map(gradeLabel).join(' / '))];
// below this chart width the ranges (about 90px each at 12px) would crowd each other: names only
const RANGES_WIDTH = 760;
const TEXT = '#a1a1aa';
const GRID = 'rgba(255, 255, 255, 0.06)';

function GradeChart({ rows }) {
    // rebuilt only when the rows change, so re-renders don't redraw the chart
    const data = useMemo(() => {
        const clears = rows.filter((row) => row.cleared);
        const count = (grades) => clears.filter((row) => grades.includes(row.grade)).length;
        const colors = GRADE_GROUPS.map(([, , , color]) => color);
        return {
            labels: GRADE_GROUPS.map(([label]) => label),
            datasets: [
                { data: GRADE_GROUPS.map(([, grades]) => count(grades)), backgroundColor: colors, borderRadius: 3 },
                { data: GRADE_GROUPS.map(([, , plus]) => count(plus)), backgroundColor: colors, borderRadius: 3 },
            ],
        };
    }, [rows]);
    const options = useMemo(() => ({
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: (items) => BAR_NAMES[items[0].datasetIndex][items[0].dataIndex],
                    label: (item) => ` ${item.formattedValue} ${item.raw === 1 ? 'clear' : 'clears'}`,
                },
            },
        },
        scales: {
            x: {
                ticks: {
                    color: TEXT, autoSkip: false, maxRotation: 0,
                    font: (c) => ({ size: c.chart.width < 500 ? 9 : 12 }),
                    // each pair's scores under its name, where there's room
                    callback(value, i) {
                        const label = this.getLabelForValue(value);
                        return this.chart.width < RANGES_WIDTH ? label : [label, GROUP_RANGES[i]];
                    },
                },
                grid: { display: false },
            },
            y: { beginAtZero: true, ticks: { color: TEXT, precision: 0 }, grid: { color: GRID } },
        },
        // the two bars of a pair close together, pairs apart
        datasets: { bar: { categoryPercentage: 0.7, barPercentage: 0.92 } },
    }), []);
    return (
        <Box h={COOP_HEIGHT}>
            <Chart type="bar" data={data} options={options} />
        </Box>
    );
}

// One arrow of LevelPicker, half its height
function LevelStep({ icon, label, disabled, onClick }) {
    return (
        <Center
            as="button" type="button" flex="1" w="full" minH="0" aria-label={label} disabled={disabled} onClick={onClick} color="phx2.fg"
            cursor={disabled ? 'not-allowed' : 'pointer'} opacity={disabled ? 0.35 : 1} _hover={disabled ? undefined : { bg: 'bg.muted' }}
        >
            <Box as={icon} boxSize="3.5" />
        </Center>
    );
}

// The level (or co-op's players), as on Phoenix 1: type one (taken on Enter or leaving the box), or step
// up and down with the arrows or arrow keys, through the levels there are
function LevelPicker({ type, level, levels, onChange }) {
    const coop = type === 'c';
    const name = coop ? 'Co-op players' : 'Level';
    const [draft, setDraft] = useState(null);
    const below = levels.findLast((l) => l < level);
    const above = levels.find((l) => l > level);
    const commit = () => {
        const typed = parseInt(draft?.replace(/\D/g, ''), 10);
        if (!Number.isNaN(typed) && levels.length) {
            const nearest = levels.reduce((best, l) => (Math.abs(l - typed) < Math.abs(best - typed) ? l : best));
            if (nearest !== level) {
                onChange(nearest);
            }
        }
        setDraft(null);
    };
    const onKeyDown = (e) => {
        if (e.key === 'Enter') {
            commit();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = e.key === 'ArrowUp' ? above : below;
            setDraft(null);
            if (next !== undefined) {
                onChange(next);
            }
        }
    };
    return (
        <HStack gap="2" fontSize="sm" color="fg.muted">
            {/* not on the smallest phones, where it would push the box to a line of its own */}
            <Text css={{ [SMALL_PHONE]: { display: 'none' } }}>{coop ? 'Players' : 'Level'}</Text>
            <HStack gap="0" h={FILTER_STYLE.h} borderWidth="1px" borderColor="phx2.emphasized" borderRadius="l2" overflow="hidden" _focusWithin={{ borderColor: 'phx2.fg' }}>
                <Box
                    as="input" type="text" inputMode="numeric" role="spinbutton" aria-label={name} aria-valuenow={level}
                    w="34px" h="full" textAlign="center" bg="transparent" color="fg" outline="none" fontSize={FILTER_STYLE.fontSize} fontVariantNumeric="tabular-nums"
                    value={draft ?? level} onChange={(e) => setDraft(e.target.value)}
                    onFocus={(e) => e.target.select()} onBlur={commit} onKeyDown={onKeyDown}
                />
                <VStack gap="0" h="full" w="6" borderStartWidth="1px" borderColor="phx2.emphasized">
                    <LevelStep icon={LuChevronUp} label={`Next ${name.toLowerCase()}`} disabled={above === undefined} onClick={() => onChange(above)} />
                    <LevelStep icon={LuChevronDown} label={`Previous ${name.toLowerCase()}`} disabled={below === undefined} onClick={() => onChange(below)} />
                </VStack>
            </HStack>
        </HStack>
    );
}

// What the level's progress bar counts: its charts cleared, cleared at a grade or better, or with a
// Perfect Game. That grade's or plate's art rides the bar (for any clear, the level's step ball: see
// levelBall). `label` follows the count: "16 / 190 S or better".
const atLeast = (grade) => (row) => row.score >= CUTOFF[grade];
const grading = (grade) => ({ label: `${gradeLabel(grade)} or better`, marker: gradeImg('phx2', grade), meets: atLeast(grade) });
const GOALS = [
    { key: 'pass', label: 'cleared', meets: () => true },
    { key: 'aaa', ...grading('aaa') },
    { key: 's', ...grading('s') },
    { key: 'ss', ...grading('ss') },
    { key: 'sss', ...grading('sss') },
    { key: 'sssplus', ...grading('sss_p') },
    { key: 'pg', label: 'PG', marker: plateImg('phx2', 'pg'), meets: (row) => row.plate === 'pg' },
];
const MARKER_WIDTH = 44;

// a level's step ball (co-op's goes by players, "n2")
const levelBall = (type, level) => chartBallImg('phx2', type, type === 'c' ? `n${level}` : level);
// the bar's color for each type, as on the Overview: its step ball's
const TYPE_COLORS = { s: 'red.500', d: 'green.500', c: 'yellow.400' };
// All's bar, stacked: how much of the goal's met charts is singles', then doubles'
const ALL_PARTS = [['s', 'Singles'], ['d', 'Doubles']];

// the goal, inline after its count: taking up only that line of text's height (its extra height pulled out
// by the margin), so the headline stays the Overview's height
function GoalPicker({ goal, onChange }) {
    return (
        <NativeSelect.Root w="auto" flexShrink="0" h="18px">
            <NativeSelect.Field
                aria-label="Progress toward" value={goal.key} onChange={(e) => onChange(e.target.value)}
                h="24px" minH="0" mt="-3px" ps="2" pe="6" borderWidth="1px" borderColor="phx2.emphasized" borderRadius="l2" bg="transparent"
                fontSize="xs" lineHeight="22px" color="phx2.fg" fontWeight="semibold" cursor="pointer"
                css={{ fieldSizing: 'content' }}
            >
                {GOALS.map(({ key, label }) => <option key={key} value={key}>{label}</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator boxSize="3" right="1.5" color="phx2.fg" />
        </NativeSelect.Root>
    );
}

// The level's headline, laid out as the Overview's progress: the name, the large number and a bar in the
// same room as its marker takes there, on one line each so it's the same height
function GoalProgress({ name, rows, goal, average, onGoalChange, type, level }) {
    const metRows = rows.filter((row) => row.cleared && goal.meets(row));
    const met = metRows.length;
    const share = (count) => (rows.length ? (100 * count) / rows.length : 0);
    const percent = share(met);
    // the bar's parts and the art on it, centered where it's at. On All, singles' then doubles', each with
    // its step ball in its middle for a label (none on a part with nothing in it). Otherwise the type's
    // color, with the goal's art (or the step ball) at the end of the fill, on the value.
    let parts = [{ key: 'met', color: TYPE_COLORS[type], percent }];
    let markers = [{ src: goal.marker ?? levelBall(type, level), at: percent }];
    if (type === 'all') {
        let start = 0;
        parts = [];
        markers = [];
        ALL_PARTS.forEach(([partType, partName]) => {
            const count = metRows.filter((row) => row.type === partType).length;
            const width = share(count);
            parts.push({ key: partType, color: TYPE_COLORS[partType], percent: width, title: `${partName}: ${count} / ${rows.length}` });
            if (count > 0) {
                markers.push({ src: levelBall(partType, level), at: start + width / 2 });
            }
            start += width;
        });
    }
    // fills from empty, as the chart's bars draw themselves in
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => setEntered(true));
        });
        return () => cancelAnimationFrame(frame);
    }, []);
    return (
        <Box>
            <HStack justify="space-between" align="center" gap={{ base: '2', sm: '4' }} mb="1">
                <Heading as="h4" fontSize={HEADING_SIZE} lineHeight="1.3" minW="0" truncate textTransform="uppercase">{name}</Heading>
                <Text {...HERO_VALUE_STYLE}>{percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%</Text>
            </HStack>
            <Box position="relative" my={HERO_BAR_MARGIN}>
                {/* as thick as the Overview's ladder */}
                <HStack
                    gap="0" h="12px" bg="bg.emphasized" borderRadius="full" overflow="hidden"
                    role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label={`${name}: ${met} / ${rows.length} ${goal.label}`}
                >
                    {parts.map((part) => (
                        <Box key={part.key} h="full" bg={part.color} w={`${entered ? part.percent : 0}%`} transition={FILL_TRANSITION} title={part.title} />
                    ))}
                </HStack>
                {/* a level without a ball of its type just goes without */}
                {markers.map(({ src, at }) => (
                    <Image
                        key={src} src={src} alt="" position="absolute" top="50%" w={`${MARKER_WIDTH}px`} h="28px" objectFit="contain" pointerEvents="none"
                        left={`${entered ? at : 0}%`} transform="translate(-50%, -50%)" transition={`left ${EASE_OUT_QUART}`}
                        filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))" onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                ))}
            </Box>
            {/* minH: the Overview's line, its title's text being taller than plain text */}
            <HStack justify="space-between" columnGap="3" mt="1" minH="18px" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                {/* always a line here, so the page doesn't shift between levels with and without clears */}
                <Text flexShrink="0">
                    {average ? (
                        <>
                            {/* the word goes on the smallest phones, to leave the goal its room */}
                            <Box as="span" css={{ [SMALL_PHONE]: { display: 'none' } }}>Average </Box>
                            <Text as="span" color="fg" fontWeight="semibold" title="Average clear">{average.toLocaleString()}</Text>
                        </>
                    ) : 'No clears yet'}
                </Text>
                <HStack ms="auto" minW="0" gap="1.5">
                    <Text flexShrink="0">{met} / {rows.length}</Text>
                    <GoalPicker goal={goal} onChange={onGoalChange} />
                </HStack>
            </HStack>
        </Box>
    );
}

// no sort to start: the rows come most recently attempted first
const COLUMNS = [JACKET_COLUMN, LEVEL_COLUMN, SONG_COLUMN, GRADE_COLUMN, PLATE_COLUMN, SCORE_COLUMN];

// The level's charts that meet the goal, or those remaining, one at a time, the open one in the URL
// (?view=remaining, or nothing): its heading beside the other's name and count, which switches to it (as
// with Overview's score tables). "Cleared", or the goal's name.
const goalTitle = ({ key, label }) => (key === 'pass' ? 'Cleared' : label);

function ChartTables({ rows, gridKey, goal }) {
    const [params, setParams] = useSearchParams();
    const view = params.get('view') === 'remaining' ? 'remaining' : 'met';
    const setView = (next) => setParams((current) => {
        const updated = new URLSearchParams(current);
        if (next === 'remaining') {
            updated.set('view', next);
        } else {
            updated.delete('view');
        }
        return updated;
    }, { replace: true });
    const met = useMemo(() => rows.filter((row) => row.cleared && goal.meets(row)), [rows, goal]);
    const remaining = useMemo(() => rows.filter((row) => !(row.cleared && goal.meets(row))), [rows, goal]);
    const shown = view === 'met' ? met : remaining;
    // the rows passing the grid's filters (as in the Overview's heading); until it says, all of them
    const [filtered, setFiltered] = useState(null);
    const count = filtered ?? shown.length;

    const title = view === 'met' ? goalTitle(goal) : 'Remaining';
    const other = view === 'met'
        ? <ViewLink label={`Remaining (${remaining.length.toLocaleString()})`} onClick={() => setView('remaining')} />
        : <ViewLink label={`${goalTitle(goal)} (${met.length.toLocaleString()})`} onClick={() => setView('met')} />;
    let empty = 'Every chart here is cleared.';
    if (view === 'met') {
        empty = goal.key === 'pass' ? 'No clears here yet.' : `None at ${goal.label} here yet.`;
    } else if (goal.key !== 'pass') {
        empty = `Every chart here is at ${goal.label}.`;
    }
    return (
        <Box>
            {/* the Overview's table's heading: its sizes, height and divider */}
            <HStack minH={FILTER_STYLE.h} mb="3">
                <TableHeading nav={view === 'met' ? { after: other } : { before: other }}>
                    <Heading
                        as="h4" fontSize={{ base: 'md', sm: 'lg', md: 'xl' }} lineHeight="1.2" whiteSpace="nowrap"
                        title={`${count.toLocaleString()} of ${shown.length.toLocaleString()}`}
                    >
                        {title} <Text as="span" color="fg.muted" fontWeight="normal">({count.toLocaleString()})</Text>
                    </Heading>
                </TableHeading>
            </HStack>
            <Separator borderColor="border" mb="4" />
            {/* a fresh grid per level, but the same one across the two lists (its rows swapped), so
                switching keeps its sort and columns, and doesn't empty the page and scroll it to the top */}
            <Box display={shown.length > 0 ? undefined : 'none'}>
                <ScoreGrid
                    key={gridKey} rowData={shown} columnDefs={COLUMNS}
                    onModelUpdated={({ api }) => setFiltered(api.getDisplayedRowCount())}
                />
            </Box>
            {shown.length === 0 && <Text color="fg.muted">{empty}</Text>}
        </Box>
    );
}

function UserBreakdown({ name, number, view, scores, counts, info }) {
    const navigate = useNavigate();
    const { search } = useLocation();
    // the goal shown is in the URL (?goal=s; nothing for Pass), so a shared link opens on it
    const [params, setParams] = useSearchParams();
    const goal = GOALS.find(({ key }) => key === params.get('goal')) ?? GOALS[0];
    const setGoal = (key) => setParams((current) => {
        const updated = new URLSearchParams(current);
        if (key === GOALS[0].key) {
            updated.delete('goal');
        } else {
            updated.set('goal', key);
        }
        return updated;
    }, { replace: true });
    const start = useMemo(() => highestCleared(scores), [scores]);
    const { type, level } = parseView(view) || { type: 'all', level: start || 20 };
    // the level last shown for singles / doubles, to go back to from co-op (which picks players instead)
    const lastLevel = useRef(start || 20);
    if (type !== 'c') {
        lastLevel.current = level;
    }
    const show = (nextType, nextLevel) => navigate(`${userPath('phx2', name, number, `breakdown/${viewOf(nextType, nextLevel)}`)}${search}`);

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

    // every chart at the level with the player's best on it, if any, in the order of their scores (most
    // recently attempted first), then the charts never played
    const rows = useMemo(() => {
        if (!list || list.error) {
            return [];
        }
        const best = new Map(scores.map((s, i) => [chartKey(s.jacket, s.type, s.level), { ...s, attemptOrder: i }]));
        const charts = type === 'c'
            ? (list[`n${level}`] || [])
            : [...(type !== 'd' ? list.s || [] : []), ...(type !== 's' ? list.d || [] : [])];
        return charts.map((chart) => {
            const jacket = chart.bg_img?.match(/([0-9a-f]{32})/)?.[1];
            const score = best.get(chartKey(jacket, chart.type, chart.level));
            return gridRow(score || { name: chart.name, jacket, type: chart.type, level: chart.level, score: null, grade: null, plate: null, unplayed: true, attemptOrder: scores.length });
        }).sort((a, b) => a.attemptOrder - b.attemptOrder);
    }, [list, scores, type, level]);

    const cleared = rows.filter((row) => row.cleared);
    const average = cleared.length ? Math.round(cleared.reduce((sum, row) => sum + row.score, 0) / cleared.length) : null;
    const levelName = type === 'c' ? `Co-op x${level}` : `${{ all: 'Level', s: 'Single', d: 'Double' }[type]} ${level}`;

    return (
        <VStack align="stretch" gap="10">
            <VStack align="stretch" gap="3">
                <HStack justify="space-between" wrap="wrap" gap="3">
                    <FilterButtons
                        value={type} options={TYPES}
                        onChange={(t) => show(t, t === 'c' ? COOP_PLAYERS[0] : (type === 'c' ? lastLevel.current : level))}
                    />
                    <LevelPicker type={type} level={level} levels={levels} onChange={(l) => show(type, l)} />
                </HStack>
                {!list ? <Center py="10"><Spinner color="phx2.fg" /></Center> : list.error ? (
                    <Text color="fg.muted">Couldn't load this level's charts right now.</Text>
                ) : (
                    // one card, laid out as the Overview's so it's the same height: progress, a divider, the chart
                    // and, but on phones, a row under it for the date
                    <VStack align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />} {...PANEL_STYLE}>
                        <GoalProgress name={levelName} rows={rows} goal={goal} average={average} onGoalChange={setGoal} type={type} level={level} />
                        <VStack align="stretch" gap="4">
                            <GradeChart rows={rows} />
                            <HStack display={{ base: 'none', sm: 'flex' }} minH={FILTER_STYLE.h} color="fg.muted">
                                <Text fontSize="xs" fontStyle="italic" minW="0" truncate>
                                    Synced: {new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Text>
                            </HStack>
                        </VStack>
                    </VStack>
                )}
            </VStack>
            {list && !list.error && <ChartTables rows={rows} goal={goal} gridKey={`${key}|${type}|${level}`} />}
        </VStack>
    );
}

export default UserBreakdown;

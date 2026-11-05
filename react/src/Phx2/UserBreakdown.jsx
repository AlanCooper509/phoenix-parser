import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Center, Grid, Heading, HStack, Image, NativeSelect, Separator, Spinner, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

import getChartsForLevel from '../API/chartlevel';
import { userPath } from '../Helpers/paths';
import { GRADES, gradeForScore, gradeLabel, isCleared } from './pumbility';
import { arrowImg, chartBallImg, gradeImg, plateImg } from '../Helpers/assets';
import { EASE_OUT_QUART, FILL_TRANSITION, GRADE_COLORS, PHONE, SMALL_PHONE } from './shared';
import ScoreGrid, {
    GRADE_COLUMN, gridRow, JACKET_COLUMN, LEVEL_COLUMN, PLATE_COLUMN, SCORE_COLUMN, SONG_COLUMN, TableHeading, ViewLink,
} from './scoreGrid';
import {
    COOP_HEIGHT, FILTER_STYLE, FilterButtons, HEADING_SIZE, HERO_BAR_MARGIN, HERO_VALUE_STYLE, PANEL_STYLE, TITLE, useSizedBox,
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
const SMALL_TITLE = 14;
// how much of a bar's color is left when it's under the goal, as a hex alpha
const BELOW_GOAL_ALPHA = '33';
const SMALL_TITLE_WIDTH = 340;

// the middle of the chart's subtitle line: under the title (its lines 1.2 x its size), the gap and the subtitle's padding
const SUBTITLE_MIDDLE = 1.2 * TITLE.size + TITLE.gap + 9 + (1.2 * 12) / 2;

// titled as on Phoenix (1), so a screenshot of the chart stands on its own
function GradeChart({ rows, title, average, clearPercent, goal }) {
    const [box, sized] = useSizedBox();
    // rebuilt only when the rows change, so re-renders don't redraw the chart
    const data = useMemo(() => {
        const clears = rows.filter((row) => row.cleared);
        const count = (grades) => clears.filter((row) => grades.includes(row.grade)).length;
        // on the PG goal, SSS+'s bar splits into its Perfect Games, under the rest of its clears, faded
        const pgGoal = goal.key === 'pg';
        const isTop = (i) => i === GRADE_GROUPS.length - 1;
        const pgs = pgGoal ? clears.filter((row) => row.plate === 'pg' && row.grade === 'sss_p').length : 0;
        const faded = (color) => `${color}${BELOW_GOAL_ALPHA}`;
        // a bar's color, faded if all it holds is under the goal's grade (a Perfect Game being SSS+)
        const colors = (grades) => GRADE_GROUPS.map((group) => {
            const held = grades(group);
            const under = goal.grade && Math.max(...held.map((grade) => CUTOFF[grade])) < CUTOFF[goal.grade];
            return under ? faded(group[3]) : group[3];
        });
        return {
            labels: GRADE_GROUPS.map(([label]) => label),
            datasets: [
                // labelled, which is how a redraw matches each to its bars: without, all but the first would regrow
                // from nothing. `stack` puts the last two in one bar, the first dataset of a stack at the bottom.
                {
                    label: 'grade', stack: 'grade', names: BAR_NAMES[0], borderRadius: 3,
                    data: GRADE_GROUPS.map(([, grades]) => count(grades)), backgroundColor: colors(([, grades]) => grades),
                },
                {
                    label: 'pg', stack: 'plus', names: GRADE_GROUPS.map(() => 'PG'), borderRadius: 3,
                    data: GRADE_GROUPS.map((group, i) => (isTop(i) ? pgs : 0)), backgroundColor: GRADE_GROUPS.map((group) => group[3]),
                },
                {
                    label: 'plus', stack: 'plus', borderRadius: 3,
                    names: BAR_NAMES[1].map((name, i) => (pgGoal && isTop(i) ? `${name} (no PG)` : name)),
                    data: GRADE_GROUPS.map(([, , plus], i) => count(plus) - (isTop(i) ? pgs : 0)),
                    backgroundColor: colors(([, , plus]) => plus).map((color, i) => (pgGoal && isTop(i) ? faded(GRADE_GROUPS[i][3]) : color)),
                },
            ],
        };
    }, [rows, goal]);
    const options = useMemo(() => ({
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true, text: title, color: TITLE.color,
                // smaller on phones, where long names would otherwise be cut off, with the height that takes off
                // (its lines' 1.2 x the difference) back under it, so what follows stays put
                font: (c) => ({ size: c.chart.width < SMALL_TITLE_WIDTH ? SMALL_TITLE : TITLE.size, weight: TITLE.weight }),
                padding: (c) => ({ top: 0, bottom: TITLE.gap + (c.chart.width < SMALL_TITLE_WIDTH ? 1.2 * (TITLE.size - SMALL_TITLE) : 0) }),
            },
            // where the Overview chart's legend is, so the graph is at the same height: empty, for ClearStats to sit in
            subtitle: {
                display: true, text: ' ', color: TEXT, font: { size: 12 },
                padding: { top: 9, bottom: 8.6 },
            },
            tooltip: {
                callbacks: {
                    title: (items) => items[0].dataset.names[items[0].dataIndex],
                    label: (item) => ` ${item.formattedValue} ${item.raw === 1 ? 'clear' : 'clears'}`,
                },
            },
        },
        scales: {
            x: {
                stacked: true,
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
            y: { stacked: true, beginAtZero: true, ticks: { color: TEXT, precision: 0 }, grid: { color: GRID } },
        },
        // the two bars of a pair close together, pairs apart
        datasets: { bar: { categoryPercentage: 0.7, barPercentage: 0.92 } },
    }), [title]);
    return (
        <Box ref={box} h={COOP_HEIGHT} position="relative">
            {sized && <Chart type="bar" data={data} options={options} />}
            <HStack position="absolute" top={`${SUBTITLE_MIDDLE}px`} left="50%" transform="translate(-50%, -50%)" w="max-content">
                <ClearStats average={average} clearPercent={clearPercent} />
            </HStack>
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
// Perfect Game. That grade's or plate's art (`icon`) goes ahead of the bar; any clear has a step arrow there instead.
// `label` follows the count: "16 / 190 ≥ S"; the select shows `option`, the table `heading`.
const atLeast = (grade) => (row) => row.score >= CUTOFF[grade];
const grading = (grade) => ({
    label: `≥ ${gradeLabel(grade)}`, option: `≥ ${gradeLabel(grade)}`, heading: `Scores ≥ ${gradeLabel(grade)}`, grade,
    icon: gradeImg('phx2', grade), meets: atLeast(grade),
});
const GOALS = [
    { key: 'pass', label: 'cleared', option: 'Cleared', heading: 'Cleared', meets: () => true },
    { key: 'aaa', ...grading('aaa') },
    { key: 's', ...grading('s') },
    { key: 'ss', ...grading('ss') },
    { key: 'sss', ...grading('sss') },
    { key: 'sss_p', ...grading('sss_p') },
    { key: 'pg', label: 'PG', option: 'PG', heading: 'PG', grade: 'sss_p', icon: plateImg('phx2', 'pg'), meets: (row) => row.plate === 'pg' },
];
const MARKER_WIDTH = 44;
// the goal with no art of its own has piugame's top-right step arrow: blank around it, so larger than it looks
const STEP_ARROW_SIZE = 40;

// a level's step ball (co-op's goes by players, "n2")
const levelBall = (type, level) => chartBallImg('phx2', type, type === 'c' ? `n${level}` : level);
// the bar's color for each type, as on the Overview: its step ball's
const TYPE_COLORS = { s: 'red.500', d: 'green.500', c: 'yellow.400' };
// All's bar, stacked: how much of the goal's met charts is singles', then doubles'
const ALL_PARTS = [['s', 'Singles'], ['d', 'Doubles']];

// the goal, for the whole tab (the bar and the tables below), between the level's title and percentage:
// taking up only 18px of that line (its extra height pulled out by the margin), so the headline stays the
// Overview's height
function GoalPicker({ goal, onChange }) {
    return (
        <HStack gap="1.5" h="18px" flexShrink="0">
            {/* not on phones, where the title and percentage leave no room for it */}
            <Text fontSize={{ base: 'xs', md: 'sm' }} color="fg.muted" whiteSpace="nowrap" css={{ [PHONE]: { display: 'none' } }}>Goal:</Text>
            <NativeSelect.Root w="auto" flexShrink="0" h="18px">
                <NativeSelect.Field
                    aria-label="Goal" value={goal.key} onChange={(e) => onChange(e.target.value)}
                    h={{ base: '26px', md: '32px' }} minH="0" mt={{ base: '-4px', md: '-7px' }} ps="2.5" pe="7" borderWidth="1px" borderColor="phx2.emphasized" borderRadius="l2" bg="transparent"
                    fontSize={{ base: 'xs', md: 'sm' }} color="phx2.fg" fontWeight="semibold" cursor="pointer"
                    css={{ fieldSizing: 'content' }}
                >
                    {/* the spaces: room after the text in the open list, as wide as its longest and ignoring padding on options */}
                    {GOALS.map(({ key, option }) => <option key={key} value={key}>{option}&nbsp;&nbsp;</option>)}
                </NativeSelect.Field>
                <NativeSelect.Indicator boxSize="3.5" right="2" color="phx2.fg" />
            </NativeSelect.Root>
        </HStack>
    );
}

// The grade images are all one size (178px tall here) with the art centered, so the narrower the grade the more
// blank there is either side of it (px of the image): trimmed so the space beside the icon is the same for any grade.
const GRADE_ART_HEIGHT = 178;
const GRADE_ART_INSET = {
    f: 76, d: 77, c: 81, b: 77, a: 80, a_p: 55, aa: 57, aa_p: 31, aaa: 34, aaa_p: 8, s: 73, s_p: 53, ss: 50, ss_p: 30, sss: 27, sss_p: 7,
};
const AVERAGE_ICON = 24;

// How much of the level is cleared, the average clear and the grade it falls in, as on the Overview's co-op rows: the icon's taller than
// the line, its extra height pulled out by the margin. Always a line here, so the card doesn't shift between
// levels with and without clears.
function ClearStats({ average, clearPercent }) {
    const grade = average && gradeForScore(average);
    return (
        <HStack gap="5px" flexShrink="0" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
            {/* its own element each, for the same space between them, a bit more between the two stats */}
            {average && <Text>Clear</Text>}
            {average && <Text color="fg" fontWeight="semibold" me="7px" title="Share of this level's charts cleared">{clearPercent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%</Text>}
            <Text>{average ? 'Average' : 'No clears yet'}</Text>
            {average && <Text color="fg" fontWeight="semibold" title="Average clear">{average.toLocaleString()}</Text>}
            {average && <Image src={gradeImg('phx2', grade)} alt={gradeLabel(grade)} title={gradeLabel(grade)} h={`${AVERAGE_ICON}px`} my="-3px" w="auto" mx={`${(-GRADE_ART_INSET[grade] * AVERAGE_ICON) / GRADE_ART_HEIGHT}px`} />}
        </HStack>
    );
}

// the count's a little smaller than the Overview's percentage below md, being longer; its line stays that
// percentage's height, so the card stays the Overview's
const COUNT_SIZE = { base: 'clamp(18px, 6vw, 24px)', sm: '26px', md: HERO_VALUE_STYLE.fontSize.md };
const COUNT_LINE = { base: HERO_VALUE_STYLE.fontSize.base, sm: '30px', md: '36px' };

// The level's headline, laid out as the Overview's progress: the name, the large number and a bar in the
// same room as its marker takes there, on one line each so it's the same height
function GoalProgress({ name, phoneName, shortName, rows, total, typeTotals, goal, onGoalChange, type, level }) {
    const metRows = rows.filter((row) => row.cleared && goal.meets(row));
    const met = metRows.length;
    const share = (count) => (total ? (100 * count) / total : 0);
    const percent = share(met);
    // the bar's parts and the art on it, centered where it's at. Otherwise the type's color, with the step
    // ball at the end of the fill, on the value. On All the colors say which is which, with no art: what's
    // met, singles' then doubles', then what's left of each in the same order, faded. Each is as wide as its
    // share of the whole level; its tooltip counts out of its own type's charts.
    let parts = [{ key: 'met', color: TYPE_COLORS[type], percent }];
    let markers = [{ src: levelBall(type, level), at: percent }];
    if (type === 'all') {
        const counted = ALL_PARTS.map(([partType, partName]) => ({
            partType, partName,
            count: metRows.filter((row) => row.type === partType).length,
            ofType: typeTotals[partType],
        }));
        parts = [
            ...counted.map(({ partType, partName, count, ofType }) => ({
                key: partType, color: TYPE_COLORS[partType], percent: share(count), title: `${partName}: ${count} / ${ofType}`,
            })),
            ...counted.map(({ partType, partName, count, ofType }) => ({
                key: `${partType}-left`, color: `${TYPE_COLORS[partType]}/25`, percent: share(ofType - count), title: `${partName} left: ${ofType - count} / ${ofType}`,
            })),
        ];
        markers = [];
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
            {/* the select in the middle wherever there's room for it: the two sides as wide as each other, each at
                least as wide as what's in it */}
            <Grid templateColumns="minmax(max-content, 1fr) auto minmax(max-content, 1fr)" alignItems="center" columnGap={{ base: '2', sm: '4' }} mb="1">
                <Heading as="h4" fontSize={HEADING_SIZE} lineHeight="1.3" whiteSpace="nowrap" color={TYPE_COLORS[type]}>
                    {/* shorter on phones, where the count takes the room; shortest where nothing longer fits beside it */}
                    <Box as="span" display={{ base: 'none', sm: 'inline' }}>{name}</Box>
                    <Box as="span" display={{ base: 'inline', sm: 'none' }} css={{ [SMALL_PHONE]: { display: 'none' } }}>{phoneName}</Box>
                    <Box as="span" display="none" css={{ [SMALL_PHONE]: { display: 'inline' } }}>{shortName}</Box>
                </Heading>
                <GoalPicker goal={goal} onChange={onGoalChange} />
                <Text justifySelf="end" whiteSpace="nowrap" {...HERO_VALUE_STYLE} lineHeight={COUNT_LINE} fontSize={COUNT_SIZE}>{met.toLocaleString()} / {total.toLocaleString()}</Text>
            </Grid>
            {/* two columns: the goal's art with the percentage centered under it, and the bar with what's left under
                its end. The art's column is the same whichever it is so the bar stays put, and clears the step ball at 0% */}
            <HStack align="start" gap="4" mt={HERO_BAR_MARGIN} fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                <VStack gap="0" w={`${MARKER_WIDTH}px`} flexShrink="0">
                    {/* the art's taller than the bar, without adding to the card's height */}
                    <Center h="12px" w="full" mb={HERO_BAR_MARGIN}>
                        {goal.icon ? (
                            <Image
                                src={goal.icon} alt={goal.option} title={goal.option} w="full" h="28px" maxW="none" flexShrink="0" objectFit="contain"
                                filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))"
                            />
                        ) : (
                            <Image src={arrowImg('phx2', 'ur')} alt={goal.option} title={goal.option} boxSize={`${STEP_ARROW_SIZE}px`} maxW="none" flexShrink="0" />
                        )}
                    </Center>
                    {/* lineHeight: the Overview's line, its title's text being taller than plain text */}
                    <Text lineHeight="18px" color="fg" fontWeight="semibold" whiteSpace="nowrap">{percent.toLocaleString(undefined, { maximumFractionDigits: 1 })}%</Text>
                </VStack>
                <VStack align="stretch" gap="0" flex="1" minW="0">
                    <Box position="relative" mb={HERO_BAR_MARGIN}>
                        {/* as thick as the Overview's ladder */}
                        <HStack
                            gap="0" h="12px" bg="bg.emphasized" borderRadius="full" overflow="hidden"
                            role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} aria-label={`${name}: ${met} / ${total} ${goal.label}`}
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
                    <Text lineHeight="18px" textAlign="right" truncate>{(total - met).toLocaleString()} remaining</Text>
                </VStack>
            </HStack>
        </Box>
    );
}

// no sort to start: the rows come most recently attempted first
const COLUMNS = [JACKET_COLUMN, LEVEL_COLUMN, SONG_COLUMN, GRADE_COLUMN, PLATE_COLUMN, SCORE_COLUMN];

// The level's charts that meet the goal, or those remaining, one at a time, the open one in the URL
// (?view=remaining, or nothing): its heading beside the other's name and count, which switches to it (as
// with Overview's score tables). "Cleared", or the goal's name.

const HEADING_ICON = 28;
const LINK_ICON = 22;
const PLATE_SCALE = 0.7;

// The goal in the table's heading, with its art for the grade or plate: taller than the text, without making the
// line any taller, and for a grade with the blank either side of it trimmed (see GRADE_ART_INSET)
function GoalName({ goal, size }) {
    if (!goal.icon) {
        return goal.heading;
    }
    const pg = goal.key === 'pg';
    // the plate's art fills its image, where a grade's has blank all around it
    const height = pg ? Math.round(size * PLATE_SCALE) : size;
    const inset = pg ? 0 : (GRADE_ART_INSET[goal.grade] * size) / GRADE_ART_HEIGHT;
    return (
        <>
            {!pg && 'Scores ≥ '}
            <Image
                src={goal.icon} alt={pg ? 'PG' : gradeLabel(goal.grade)} title={pg ? 'PG' : gradeLabel(goal.grade)} display="inline-block" verticalAlign="middle"
                h={`${height}px`} w="auto" maxW="none" my={`${(14 - height) / 2}px`} mx={`${-inset}px`}
            />
        </>
    );
}

// `listStatus` is the chart list's, which adds the charts never played to Remaining: 'loading' or 'error'
// until it's there, when `total` still gives how many there are.
function ChartTables({ rows, total, listStatus, gridKey, goal }) {
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
    const remainingTotal = total - met.length;
    // the Remaining rows are still coming: the heading says how many there'll be
    const partial = view === 'remaining' && listStatus !== 'ready';
    // the rows passing the grid's filters (as in the Overview's heading); until it says, all of them
    const [filtered, setFiltered] = useState(null);
    const count = partial ? remainingTotal : (filtered ?? shown.length);

    const title = view === 'met' ? <GoalName goal={goal} size={HEADING_ICON} /> : 'Remaining';
    const other = view === 'met'
        ? <ViewLink label={`Remaining (${remainingTotal.toLocaleString()})`} onClick={() => setView('remaining')} />
        : <ViewLink label={<><GoalName goal={goal} size={LINK_ICON} /> ({met.length.toLocaleString()})</>} onClick={() => setView('met')} />;
    let empty = 'Every chart here is cleared.';
    if (partial) {
        empty = '';
    } else if (view === 'met') {
        empty = goal.key === 'pass' ? 'No clears here yet.' : `No ${goal.heading} here yet.`;
    } else if (goal.key !== 'pass') {
        empty = `Every chart here is ${goal.label}.`;
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
                {partial && listStatus === 'loading' && <Spinner size="xs" color="phx2.fg" aria-label="Loading the charts never played" />}
            </HStack>
            <Separator borderColor="border" mb="4" />
            {partial && listStatus === 'error' && <Text color="fg.muted" fontSize="sm" mb="3">Couldn't load the charts never played right now.</Text>}
            {/* a fresh grid per level, but the same one across the two lists (its rows swapped), so
                switching keeps its sort and columns, and doesn't empty the page and scroll it to the top */}
            <Box display={shown.length > 0 ? undefined : 'none'}>
                <ScoreGrid
                    key={gridKey} rowData={shown} columnDefs={COLUMNS}
                    onModelUpdated={({ api }) => setFiltered(api.getDisplayedRowCount())}
                />
            </Box>
            {shown.length === 0 && empty && <Text color="fg.muted">{empty}</Text>}
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
    // recently attempted first), then the charts never played. Those are all the chart list adds, so nothing
    // waits on it: until it's here, the rows are the player's scores at the level.
    const rows = useMemo(() => {
        if (!list || list.error) {
            const atLevel = (s) => (type === 'c'
                ? s.type === 'c' && s.level === `n${level}`
                : (type === 'all' ? s.type === 's' || s.type === 'd' : s.type === type) && Number(s.level) === level);
            return scores.filter(atLevel).map((s, i) => gridRow({ ...s, attemptOrder: i }));
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

    // how many charts the level has: the list's when it's here, otherwise the chart counts'
    const listReady = list && !list.error;
    const levelTotals = counts?.[String(level).padStart(2, '0')];
    const typeCount = (t) => rows.filter((row) => row.type === t).length;
    const typeTotals = listReady
        ? { s: typeCount('s'), d: typeCount('d') }
        : { s: levelTotals?.singles ?? typeCount('s'), d: levelTotals?.doubles ?? typeCount('d') };
    let total = rows.length;
    if (!listReady) {
        total = type === 'c'
            ? counts?.coop?.[`n${level}`] ?? rows.length
            : { all: typeTotals.s + typeTotals.d, s: typeTotals.s, d: typeTotals.d }[type];
    }
    let listStatus = 'loading';
    if (list) {
        listStatus = list.error ? 'error' : 'ready';
    }

    const cleared = rows.filter((row) => row.cleared);
    const average =cleared.length ? Math.round(cleared.reduce((sum, row) => sum + row.score, 0) / cleared.length) : null;
    const levelName = { all: `LEVEL ${level}`, s: `SINGLE Lv. ${level}`, d: `DOUBLE Lv. ${level}`, c: `CO-OP x${level}` }[type];
    // as on Phoenix (1)
    const chartName = { all: `Level ${level}`, s: `S${level}`, d: `D${level}`, c: `Co-op x${level}` }[type];

    // a type with no charts at the level (singles' Lv.27, doubles' Lv.1) can't be picked. Co-op has its own
    // levels, and coming from it goes back to the level last shown.
    const typeLevel = type === 'c' ? lastLevel.current : level;
    const levelCounts = counts?.[String(typeLevel).padStart(2, '0')];
    const unavailable = (field, typeName) => (counts && !(levelCounts?.[field] > 0) ? `No ${typeName} charts at Lv.${typeLevel}` : undefined);
    const typeOptions = TYPES.map(([key, label]) => [key, label, {
        all: unavailable('total', 'singles or doubles'), s: unavailable('singles', 'singles'), d: unavailable('doubles', 'doubles'),
    }[key]]);

    return (
        <VStack align="stretch" gap="10">
            <VStack align="stretch" gap="3">
                <HStack justify="space-between" wrap="wrap" gap="3">
                    <FilterButtons
                        value={type} options={typeOptions}
                        onChange={(t) => show(t, t === 'c' ? COOP_PLAYERS[0] : (type === 'c' ? lastLevel.current : level))}
                    />
                    <LevelPicker type={type} level={level} levels={levels} onChange={(l) => show(type, l)} />
                </HStack>
                {/* one card, laid out as the Overview's so it's the same height: progress, a divider, the chart
                    and, but on phones, a row under it for the date */}
                <VStack align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />} {...PANEL_STYLE}>
                    <GoalProgress name={levelName} phoneName={{ all: `LEVEL ${level}`, s: `SINGLE ${level}`, d: `DOUBLE ${level}`, c: `CO-OP x${level}` }[type]} shortName={{ all: `Lv. ${level}`, s: `S${level}`, d: `D${level}`, c: `C${level}` }[type]} rows={rows} total={total} typeTotals={typeTotals} goal={goal} onGoalChange={setGoal} type={type} level={level} />
                    <VStack align="stretch" gap="4">
                        <GradeChart rows={rows} title={`${info.player}: ${chartName} Best Scores`} average={average} clearPercent={total ? (100 * cleared.length) / total : 0} goal={goal} />
                        <HStack display={{ base: 'none', sm: 'flex' }} minH={FILTER_STYLE.h} color="fg.muted">
                            <Text fontSize="xs" fontStyle="italic" minW="0" truncate>
                                Synced: {new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </HStack>
                    </VStack>
                </VStack>
            </VStack>
            <ChartTables rows={rows} total={total} listStatus={listStatus} goal={goal} gridKey={`${type}|${level}`} />
        </VStack>
    );
}

export default UserBreakdown;

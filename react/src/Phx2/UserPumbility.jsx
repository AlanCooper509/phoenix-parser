import { useLayoutEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Grid, HStack, Image, Separator, Text, useBreakpointValue, VStack } from '@chakra-ui/react';
import { LuTrendingUp } from 'react-icons/lu';
import { Chart } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';

import { gradeImg, stepballImg } from '../Helpers/assets';
import {
    bestFifty, chartValue, DOUBLE_MILESTONES, GRADES, gradeLabel, progressAlong, pumbilityProgress, scoreValue, SINGLE_MILESTONES,
} from './pumbility';
import { ExpBar, formatPumbility, pumbilityTier, TierName, tierOfPoints, titleOfPoints, TitleText, UnfilledFifty } from './shared';
import {
    COOP_HEIGHT, FILTER_STYLE, FilterButtons, HEADING_SIZE, HERO_VALUE_STYLE, PANEL_STYLE, TITLE, useSizedBox,
} from './UserOverview';
import UserTopFifty from './UserTopFifty';

// PUMBILITY, laid out as the Overview and Breakdown: All / Singles / Doubles on top, then one card with the
// progress toward the next tier (or title), the best 50 as a chart and what new clears and upgrades would
// add, then the best 50 themselves. Values use the Phoenix 2 formula (see pumbility.js).

const FILTERS = [['both', 'All'], ['s', 'Singles'], ['d', 'Doubles']];
// as Overview's, in the URL (?type=singles; nothing for All)
const FILTER_PARAMS = { s: 'singles', d: 'doubles' };
const TYPE_NAMES = { both: 'Singles and Doubles', s: 'Singles', d: 'Doubles' };
const TYPE_COLORS = { s: 'red.500', d: 'green.500' };
const TEXT = '#a1a1aa';
const GRID = 'rgba(255, 255, 255, 0.06)';
const HERO_MARKER_ROOM = 44;
const STEPBALL_SIZE = 30;

// The best fifty of the type picked: their values (highest first), total and floor (the 50th best,
// which a chart has to beat to count), and the scores themselves
function fiftyOf(scores, filter) {
    const ofType = filter === 'both' ? scores : scores.filter((s) => s.type === filter);
    const valued = ofType.map((score) => ({ score, value: scoreValue(score) })).filter(({ value }) => value > 0)
        .sort((a, b) => b.value - a.value).slice(0, 50);
    const { top, total, floor } = bestFifty(valued.map(({ value }) => value));
    return { top, total, floor, scores: valued.map(({ score }) => score), full: top.length === 50 };
}

// ---- the card's progress: toward the next tier level (All) or title (Singles, Doubles), zoomed in

function Hero({ info, fifty, filter }) {
    const all = filter === 'both';
    const value = all ? (info.pumbility?.value ?? fifty.total) : fifty.total;
    const progress = all ? pumbilityProgress(value) : progressAlong(filter === 's' ? SINGLE_MILESTONES : DOUBLE_MILESTONES, value);
    const tier = pumbilityTier(info.pumbility);
    const color = all ? tier.color : TYPE_COLORS[filter];
    let heading = <Text fontSize={HEADING_SIZE} fontWeight="bold" color="fg.muted">{all ? 'No tier yet' : `No ${TYPE_NAMES[filter].toLowerCase()} title yet`}</Text>;
    if (progress.current) {
        heading = all
            ? <TierName tier={progress.current.name} fontSize={HEADING_SIZE} lineHeight="1.3" />
            : <TitleText title={progress.current.title} fontSize={HEADING_SIZE} lineHeight="1.3" />;
    }
    return (
        <Box>
            <HStack justify="space-between" align="center" gap={{ base: '2', sm: '4' }} mb="1">
                {/* the heading alone beside the value, cut short only if it must be: how full the best 50 is goes
                    under the bar */}
                <Box minW="0">{heading}</Box>
                <Text {...HERO_VALUE_STYLE}>{formatPumbility(value)}</Text>
            </HStack>
            <ExpBar
                value={value} progress={progress} color={color} size="md" markerRoom={HERO_MARKER_ROOM}
                marker={all ? tier.icon : stepballImg('phx2', filter)} markerSize={all ? undefined : STEPBALL_SIZE}
                points={false}
                // where the Overview has the rank: what a chart has to beat to count, or while the best 50 aren't all
                // there yet (every clear counting), how many are
                footer={fifty.full ? (
                    <Text flexShrink="0" title="Your 50th best chart: a new clear counts once it's worth more">
                        50th best <Text as="span" color="fg" fontWeight="semibold">{formatPumbility(fifty.floor)}</Text>
                    </Text>
                ) : (
                    <Box flexShrink="0">
                        <UnfilledFifty counted={fifty.top.length} what={all ? 'charts' : TYPE_NAMES[filter].toLowerCase()} color={color} />
                    </Box>
                )}
            />
        </Box>
    );
}

// ---- the card's chart: the best 50 themselves, highest first, each in the color of the tier its points
// reach x 50, with a line at the average a chart needs for the next tier (or title)

const TITLE_MILESTONES = { s: SINGLE_MILESTONES, d: DOUBLE_MILESTONES };
// What a chart's points reach x 50, and its color: on All the tier, on Singles or Doubles the title (as their
// ladders on the Overview are colored)
function reachOf(points, filter) {
    if (filter !== 'both') {
        return titleOfPoints(points, TITLE_MILESTONES[filter]) ?? { name: 'no title', color: TEXT };
    }
    const tier = tierOfPoints(points);
    return tier ?? { name: 'no tier', color: TEXT };
}
// a color, see-through by `alpha` (0 to 1)
function fade(color, alpha) {
    if (color.startsWith('#')) {
        return `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    }
    return color.replace(/^rgb\((.*)\)$/, `rgba($1, ${alpha})`);
}

// Lines across the chart at an average: the next milestone's (dashed, labelled above it on the right) and the
// player's own (dotted, labelled below it on the left), so the two labels stay apart however close the lines
const averageLines = {
    id: 'averageLines',
    afterDatasetsDraw(chart, args, { lines = [] }) {
        const { ctx, chartArea: { left, right }, scales: { y } } = chart;
        for (const { value, label, color, dash, below } of lines) {
            if (!value || value < y.min || value > y.max) {
                continue;
            }
            const at = Math.round(y.getPixelForValue(value)) + 0.5;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.75;
            ctx.setLineDash(dash);
            ctx.beginPath();
            ctx.moveTo(left, at);
            ctx.lineTo(right, at);
            ctx.stroke();
            // on a dark backing, so it reads over any bar's color
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.font = '600 11px sans-serif';
            const width = ctx.measureText(label).width;
            const x = below ? left + 4 : right - 4 - width;
            const top = below ? at + 3 : at - 3 - 15;
            ctx.fillStyle = 'rgba(20, 21, 24, 0.85)';
            ctx.fillRect(x - 4, top, width + 8, 15);
            ctx.fillStyle = color;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, top + 8);
            ctx.restore();
        }
    },
};
const FIFTY_PLUGINS = [averageLines];
// what the chart's called, short enough for phones: "TUSA: PUMBILITY", "TUSA: Singles PUMBILITY"
const chartTitle = (player, filter, what) => `${player}: ${filter === 'both' ? '' : `${TYPE_NAMES[filter]} `}${what}`;

function FiftyChart({ fifty, filter, info, next, value }) {
    const [box, sized] = useSizedBox();
    // on phones the plot gets the width: no "Rating" beside the axis (its numbers and the title say what it is),
    // and smaller numbers closer to it
    const narrow = useBreakpointValue({ base: true, md: false }) ?? false;
    const { data, options } = useMemo(() => {
        const points = fifty.scores.map(scoreValue);
        const average = next ? next.value / 50 : null;
        const own = value / 50;
        // from just under the lowest bar (or a line), so the differences between them show
        const low = Math.floor(Math.min(...points, average ?? Infinity, own) / 10) * 10 - 10;
        const high = Math.ceil(Math.max(...points, average ?? 0, own) / 10) * 10;
        return {
            data: {
                labels: points.map((v, i) => String(i + 1)),
                datasets: [{
                    data: points, backgroundColor: points.map((v) => fade(reachOf(v, filter).color, 0.7)), borderColor: points.map((v) => reachOf(v, filter).color), borderWidth: 1,
                    borderRadius: 2, categoryPercentage: 0.9, barPercentage: 0.9,
                }],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true, text: chartTitle(info.player, filter, 'PUMBILITY'),
                        color: TITLE.color, font: { size: TITLE.size, weight: TITLE.weight }, padding: { top: 0, bottom: TITLE.gap },
                    },
                    legend: { display: false },
                    averageLines: {
                        lines: [
                            // in the next milestone's own color (its tier, or title), as the bars are in what each reaches
                            { value: average, label: next ? `${next.name}: ${formatPumbility(average)}` : '', color: average ? reachOf(average, filter).color : TEXT, dash: [5, 4] },
                            { value: own, label: `Your average: ${formatPumbility(own)}`, color: '#4ade80', dash: [2, 3], below: true },
                        ],
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const score = fifty.scores[items[0].dataIndex];
                                return `#${items[0].dataIndex + 1} ${score.name}`;
                            },
                            label: (item) => {
                                const score = fifty.scores[item.dataIndex];
                                return ` ${score.type.toUpperCase()}${Number(score.level)} ${gradeLabel(score.grade)}: ${formatPumbility(item.raw)} (${reachOf(item.raw, filter).name})`;
                            },
                        },
                    },
                },
                scales: {
                    // no numbers along the bottom (1 to 50, crowded on phones): the bars are the best 50, in order
                    x: { ticks: { display: false }, grid: { display: false }, title: { display: true, text: 'Scores', color: TEXT } },
                    y: {
                        min: Math.max(0, low), max: high, grid: { color: GRID },
                        ticks: { color: TEXT, font: { size: narrow ? 10 : 12 }, padding: narrow ? 2 : 3 },
                        title: { display: !narrow, text: 'Rating', color: TEXT },
                    },
                },
            },
        };
    }, [fifty, filter, info.player, next, value, narrow]);
    return (
        <Box ref={box} h={COOP_HEIGHT}>
            {sized && (fifty.scores.length
                ? <Chart type="bar" data={data} options={options} plugins={FIFTY_PLUGINS} />
                : <Text color="fg.muted" textAlign="center" pt="20">No clears counting toward PUMBILITY yet.</Text>)}
        </Box>
    );
}

// ---- under the chart: what the best 50 are made of, as a small table: a row per type, a column per chart level,
// each cell the count there, tinted in the type's color the more there are (as the Next Score grid is laid out)

const TYPE_BAR = { s: 'red.500', d: 'green.500' };

function Composition({ fifty }) {
    const { types, levels, most } = useMemo(() => {
        const counted = ['s', 'd'].map((type) => {
            const byLevel = new Map();
            for (const score of fifty.scores.filter((s) => s.type === type)) {
                const level = Number(score.level);
                const cell = byLevel.get(level) || { count: 0, points: 0 };
                cell.count += 1;
                cell.points += scoreValue(score);
                byLevel.set(level, cell);
            }
            return { type, byLevel, count: [...byLevel.values()].reduce((sum, c) => sum + c.count, 0) };
        }).filter(({ count }) => count > 0);
        const all = counted.flatMap(({ byLevel }) => [...byLevel.keys()]);
        return {
            types: counted,
            // every level from the lowest to the highest there, so the columns read as a run of levels
            levels: all.length ? Array.from({ length: Math.max(...all) - Math.min(...all) + 1 }, (_, i) => Math.min(...all) + i) : [],
            most: Math.max(0, ...counted.flatMap(({ byLevel }) => [...byLevel.values()].map((c) => c.count))),
        };
    }, [fifty]);
    if (!types.length) {
        return null;
    }
    const total = fifty.scores.length;
    return (
        // scrolls sideways only if there are more levels than fit, the type names staying put
        <Box overflowX="auto">
            <Box as="table" mx="auto" css={{ borderCollapse: 'separate', borderSpacing: '3px' }} fontVariantNumeric="tabular-nums">
                <thead>
                    <tr>
                        <Box as="th" position="sticky" left="0" bg="bg.subtle" textAlign="start" fontSize="xs" color="fg.muted" fontWeight="medium" verticalAlign="bottom">Lv.</Box>
                        {levels.map((level) => (
                            <Box as="th" key={level} fontSize="xs" color="fg.muted" fontWeight="medium" textAlign="center" minW={{ base: '30px', md: '40px' }}>
                                {level}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {types.map(({ type, byLevel, count }) => (
                        <tr key={type}>
                            <Box as="th" textAlign="start" fontSize={{ base: 'xs', md: 'sm' }} fontWeight="semibold" color={TYPE_BAR[type]} whiteSpace="nowrap" pe="2" position="sticky" left="0" bg="bg.subtle">
                                {TYPE_NAMES[type]} <Text as="span" color="fg.muted" fontWeight="normal">({count})</Text>
                            </Box>
                            {levels.map((level) => {
                                const cell = byLevel.get(level);
                                return (
                                    <Box
                                        as="td" key={level} h={{ base: '26px', md: '30px' }} textAlign="center" borderRadius="md" fontSize={{ base: 'xs', md: 'sm' }}
                                        // stronger the more of the best 50 are there
                                        bg={cell ? `${TYPE_BAR[type]}/${Math.round(15 + (55 * cell.count) / most)}` : 'transparent'}
                                        color={cell ? 'fg' : 'fg.subtle'} fontWeight={cell ? 'semibold' : 'normal'}
                                        title={cell ? `${type.toUpperCase()}${level}: ${cell.count} of your best ${total}, ${formatPumbility(cell.points)}` : undefined}
                                    >
                                        {cell ? cell.count : '-'}
                                    </Box>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    );
}

// ---- Next clears: what one more clear, or one grade up, adds at each level and grade

// grades a new clear can be aimed at, lowest first, and the levels (doubles' numbering) to look at
const AIM_GRADES = GRADES.filter(([key]) => key !== 'f' && key !== 'd' && key !== 'c' && key !== 'b');
const PRICE_LEVELS = Array.from({ length: 20 }, (_, i) => 29 - i);

// How many charts worth `value` it takes to get from `total` to `target`: each new one replaces the
// lowest of the best fifty (or fills it, while it isn't full). null if they never would.
function clearsToReach(value, top, total, target) {
    if (!target || total >= target) {
        return null;
    }
    const best = [...top];
    let sum = total;
    for (let k = 1; k <= 50; k++) {
        if (best.length < 50) {
            best.push(value);
            sum += value;
        } else {
            const lowest = best[best.length - 1];
            if (value <= lowest) {
                return null;
            }
            sum += value - lowest;
            best[best.length - 1] = value;
        }
        best.sort((a, b) => b - a);
        if (sum >= target - 1e-6) {
            return k;
        }
    }
    return null;
}

// a row's charts: doubles at its level and singles one below (priced one level up), of the types shown that
// have charts there (`counts`, the chart counts per level, while they load: all)
function rowParts(level, filter, counts) {
    const has = (type, at) => !counts || (counts[String(at).padStart(2, '0')]?.[type === 's' ? 'singles' : 'doubles'] ?? 0) > 0;
    return [
        ...(filter !== 's' && has('d', level) ? [`D${level}`] : []),
        ...(filter !== 'd' && level - 1 >= 10 && has('s', level - 1) ? [`S${level - 1}`] : []),
    ];
}

// (Upscore is 'upgrade' in the URL, as it was named before)
const MODES = [['new', 'New'], ['upgrade', 'Upscore']];

// Every level that counts is listed, but when there are more than fit the grid opens scrolled to the player's
// own: just above their highest clear (a stretch, REACH_ABOVE levels up) at the right, lower levels to its left.
const REACH_ABOVE = 2;

function NextClears({ scores, fifty, filter, next, mode, counts }) {
    // singles are priced as doubles one level up: the rows go by doubles' levels either way
    const valueAt = (level, grade) => chartValue('d', level, grade, null);
    const priceLevel = (score) => Number(score.level) + (score.type === 's' ? 1 : 0);
    // the highest level cleared, of the types shown (none yet: every level)
    const reach = scores
        .filter((score) => (filter === 'both' ? score.type === 's' || score.type === 'd' : score.type === filter) && scoreValue(score) > 0)
        .reduce((best, score) => Math.max(best, priceLevel(score)), 0) || Infinity;

    // New: every level where some grade would count, and the grades from the lowest that does anywhere. Upscore
    // has the same levels and grades, so switching between them keeps the grid's shape (and where it's scrolled to)
    const newRows = PRICE_LEVELS.filter((level) => rowParts(level, filter, counts).length)
        .map((level) => ({
            level,
            cells: AIM_GRADES.map(([grade]) => {
                const value = valueAt(level, grade);
                const gain = fifty.full ? value - fifty.floor : value;
                return gain > 0.005 ? { grade, value, gain, count: clearsToReach(value, fifty.top, fifty.total, next?.value) } : { grade, value };
            }),
        }))
        .filter((row) => row.cells.some((cell) => cell.gain));
    // Upscore: one grade up from the one below, wherever any of the best fifty sit at that one (a "-" elsewhere)
    const rows = mode === 'new' ? newRows : newRows.map(({ level }) => ({
        level,
        cells: AIM_GRADES.map(([grade], i) => {
            if (i === 0) {
                return { grade };
            }
            const below = AIM_GRADES[i - 1][0];
            const gain = valueAt(level, grade) - valueAt(level, below);
            const charts = fifty.scores.filter((s) => priceLevel(s) === level && s.grade === below).length;
            return { grade, value: valueAt(level, grade), gain, charts, below };
        }),
    }));
    // the level the grid opens at: the highest listed at most REACH_ABOVE over the highest clear
    const focus = rows.find((row) => row.level <= reach + REACH_ABOVE)?.level ?? rows[rows.length - 1]?.level;
    const grid = useRef(null);
    useLayoutEffect(() => {
        const column = grid.current?.querySelector(`thead th[data-level="${focus}"]`);
        if (column) {
            grid.current.scrollLeft = Math.max(0, column.offsetLeft + column.offsetWidth - grid.current.clientWidth);
        }
    }, [focus, filter, rows.length]);

    const firstGrade = Math.min(...newRows.map((row) => row.cells.findIndex((cell) => cell.gain > 0)).filter((i) => i >= 0));
    const grades = AIM_GRADES.slice(Number.isFinite(firstGrade) ? firstGrade : 0);

    if (!rows.length) {
        return <Text color="fg.muted">No new clear would raise your PUMBILITY.</Text>;
    }
    const shown = grades.map(([grade]) => grade);
    const cellOf = (row, grade) => row.cells.find((cell) => cell.grade === grade);
    const gradeHead = (grade) => (
        // the grade's art (named on hover), the same size on New and Upscore; no wider than its column
        <HStack as="span" gap="0.5" justify="center" title={mode === 'upgrade' ? `Up to ${gradeLabel(grade)}` : gradeLabel(grade)}>
            <Image src={gradeImg('phx2', grade)} alt={gradeLabel(grade)} h={{ base: '18px', md: '22px' }} w="auto" maxW="full" minW="0" objectFit="contain" />
        </HStack>
    );
    // a level's charts: on phones one name per line, rather than widen the column
    const levelHead = (row) => rowParts(row.level, filter, counts).map((part, i) => (
        <Box as="span" key={part} display={{ base: 'block', md: 'inline' }}>
            {i > 0 && <Box as="span" display={{ base: 'none', md: 'inline' }}> / </Box>}
            {part}
        </Box>
    ));
    // best grade first, lowest level first (as the Overview's level chart reads, left to right)
    const gradeRows = [...shown].reverse();
    const levelColumns = [...rows].reverse();
    return (
        // Grades down, levels across: a row is what one grade is worth at each level. Scrolls sideways when
        // there are more levels than fit, the grades staying put. Not stretched to the card on wide screens.
        <Box ref={grid} overflowX="auto">
            <Box
                as="table" w={{ base: 'full', md: 'auto' }} mx="auto"
                css={{ borderCollapse: 'separate', borderSpacing: '3px', '@media screen and (max-width: 767.98px)': { borderSpacing: '2px' } }}
                fontVariantNumeric="tabular-nums"
            >
                <thead>
                    <tr>
                        {/* over the grades: empty on New, their art says what they are; on Upscore the trend icon, once
                            for all of them (each row is one grade up, to its grade) */}
                        <Box as="th" position="sticky" left="0" bg="bg.subtle" zIndex="1" aria-label={mode === 'upgrade' ? 'Up to grade' : 'Grade'} verticalAlign="bottom" pb="1">
                            {mode === 'upgrade' && <Box as={LuTrendingUp} boxSize="4" color="phx2.fg" mx="auto" title="One grade up, to" />}
                        </Box>
                        {levelColumns.map((row) => (
                            // centered over its column, every label's last line on the same line as the others'
                            <Box
                                as="th" key={row.level} data-level={row.level} fontSize={{ base: 'xs', md: 'sm' }} fontWeight="semibold" whiteSpace="nowrap"
                                lineHeight="1.2" pb="1" textAlign="center" verticalAlign="bottom" w={CELL_SIZE.w} minW={CELL_SIZE.minW} maxW={CELL_SIZE.maxW}
                            >
                                {levelHead(row)}
                            </Box>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {gradeRows.map((grade) => (
                        <tr key={grade}>
                            {/* at least as wide as the widest grade's art: with more levels than fit, the table squeezes its
                                columns, and would squeeze the art away */}
                            <Box as="th" pe={{ base: '1', md: '2' }} minW={{ base: '38px', md: '52px' }} position="sticky" left="0" bg="bg.subtle" zIndex="1">{gradeHead(grade)}</Box>
                            {levelColumns.map((row) => <PlanCell key={row.level} cell={cellOf(row, grade)} mode={mode} next={next} filter={filter} />)}
                        </tr>
                    ))}
                </tbody>
            </Box>
        </Box>
    );
}

// every level's column and cell the same size in New and Upscore: room for the widest (a tier icon and +117.4,
// or +2.6 ×12), slimmer on phones, where there's no icon
const CELL_SIZE = { w: { base: '42px', md: '96px' }, minW: { base: '42px', md: '96px' }, maxW: { base: '42px', md: '96px' }, h: { base: '30px', md: '33px' } };

function PlanCell({ cell, mode, next, filter }) {
    const tier = cell.value && tierOfPoints(cell.value);
    const reach = cell.value && reachOf(cell.value, filter);
    const counts = mode === 'new' ? cell.gain > 0 : cell.charts > 0;
    let title;
    if (mode === 'new' && counts) {
        title = `A ${gradeLabel(cell.grade)} here is worth ${formatPumbility(cell.value)} (× 50 = ${reach.name}), adding ${formatPumbility(cell.gain)}`;
        if (cell.count) {
            title += `; ${cell.count} like it reach ${next.name}`;
        }
    } else if (mode === 'upgrade' && cell.gain) {
        title = `${gradeLabel(cell.below)} to ${gradeLabel(cell.grade)} adds ${formatPumbility(cell.gain)}; ${cell.charts} of your best 50 here ${cell.charts === 1 ? 'is' : 'are'} ${gradeLabel(cell.below)}`;
    }
    return (
        <Box
            // one size whatever's in it, so New and Upscore lay the grid out the same
            as="td" position="relative" textAlign="center" {...CELL_SIZE} px={{ base: '0.5', md: '1.5' }} borderRadius="md" title={title} verticalAlign="middle"
            bg={counts && reach ? fade(reach.color, 0.18) : 'transparent'} opacity={counts ? 1 : 0.35}
        >
            <HStack gap={{ base: '0.5', md: '1' }} justify="center">
                {/* the tier's icon on All (titles have none), but not on phones, where it's the gain that has to fit */}
                {counts && tier && filter === 'both' && <Image src={tier.icon} alt={tier.name} boxSize="28px" my="-5px" ms="-1" flexShrink="0" display={{ base: 'none', md: 'block' }} />}
                <Text fontSize={{ base: 'xs', md: 'sm' }} fontWeight={counts ? 'semibold' : 'normal'} color={counts ? 'fg' : 'fg.subtle'} whiteSpace="nowrap">
                    {counts ? `+${cell.gain.toFixed(1)}` : '-'}
                </Text>
            </HStack>
            {/* on Upscore, how many of yours sit at the grade below: tucked in the corner, so the gain stays centered
                where New has it */}
            {mode === 'upgrade' && counts && (
                <Text position="absolute" right={{ base: '2px', md: '4px' }} bottom={{ base: '0', md: '1px' }} fontSize={{ base: '8px', md: '9px' }} lineHeight="1" color="fg.muted" whiteSpace="nowrap">
                    ×{cell.charts}
                </Text>
            )}
        </Box>
    );
}

// ---- the tab

function UserPumbility({ scores, counts, summary, info }) {
    const [params, setParams] = useSearchParams();
    const setParam = (key, value) => setParams((current) => {
        const updated = new URLSearchParams(current);
        if (value) {
            updated.set(key, value);
        } else {
            updated.delete(key);
        }
        return updated;
    }, { replace: true });
    const filter = Object.keys(FILTER_PARAMS).find((key) => FILTER_PARAMS[key] === params.get('type')) ?? 'both';
    const mode = params.get('mode') === 'upgrade' ? 'upgrade' : 'new';

    const fifty = useMemo(() => fiftyOf(scores, filter), [scores, filter]);
    const all = filter === 'both';
    const value = all ? (info.pumbility?.value ?? fifty.total) : fifty.total;
    const next = (all ? pumbilityProgress(value) : progressAlong(filter === 's' ? SINGLE_MILESTONES : DOUBLE_MILESTONES, value)).next;

    // what plates add to a clear at the level most of the best 50 are, from the least (FG) to the most (PG): the
    // grid's numbers assume none
    const usual = useMemo(() => {
        const tally = new Map();
        for (const score of fifty.scores) {
            const key = `${score.type}${Number(score.level)}`;
            tally.set(key, { type: score.type, level: Number(score.level), count: (tally.get(key)?.count ?? 0) + 1 });
        }
        return [...tally.values()].sort((a, b) => b.count - a.count || b.level - a.level)[0] ?? null;
    }, [fifty]);
    const plateRange = usual && ['fg', 'pg'].map((plate) => chartValue(usual.type, usual.level, 'ss', plate) - chartValue(usual.type, usual.level, 'ss', null));
    const fiftyName = { both: 'Overall PUMBILITY', s: 'Singles PUMBILITY', d: 'Doubles PUMBILITY' }[filter];

    return (
        <VStack align="stretch" gap="10">
            <VStack align="stretch" gap="3">
                <FilterButtons value={filter} options={FILTERS} onChange={(f) => setParam('type', FILTER_PARAMS[f])} />
                <VStack align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />} {...PANEL_STYLE}>
                    <Hero info={info} fifty={fifty} filter={filter} />
                    <VStack align="stretch" gap="4">
                        <FiftyChart fifty={fifty} filter={filter} info={info} next={next} value={value} />
                        {/* a light line, the level table being more of the best 50 rather than a section of its own */}
                        <Separator borderColor="border" />
                        <Composition fifty={fifty} />
                        <HStack display={{ base: 'none', sm: 'flex' }} minH={FILTER_STYLE.h} color="fg.muted">
                            <Text fontSize="xs" fontStyle="italic" minW="0" truncate>
                                Synced: {new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                        </HStack>
                    </VStack>
                    {/* what to aim for next, titled as the chart above it is */}
                    <VStack align="stretch" gap="3">
                        {/* one row: the title centered as the chart's is, with New / Upscore on the right (an empty column
                            as wide on the left keeps it centered); on phones, without the room, the title starts the row */}
                        <Grid templateColumns={{ base: '1fr auto', md: '1fr auto 1fr' }} alignItems="center" columnGap="3">
                            <Box display={{ base: 'none', md: 'block' }} />
                            <Box textAlign={{ base: 'start', md: 'center' }} minW="0">
                                <Text
                                    color={TITLE.color} fontFamily={ChartJS.defaults.font.family}
                                    fontSize={{ base: '14px', sm: `${TITLE.size}px` }} fontWeight={TITLE.weight} lineHeight="1.2"
                                >
                                    {chartTitle(info.player, filter, 'Next Score')}
                                </Text>
                                {plateRange && (
                                    <Text fontSize="xs" color="fg.muted" mt="0.5">
                                        (plates add +{plateRange[0].toFixed(1)} to +{plateRange[1].toFixed(1)} at {usual.type.toUpperCase()}{usual.level})
                                    </Text>
                                )}
                            </Box>
                            <Box justifySelf="end">
                                <FilterButtons value={mode} options={MODES} onChange={(m) => setParam('mode', m === 'upgrade' ? 'upgrade' : null)} />
                            </Box>
                        </Grid>
                        <NextClears scores={scores} fifty={fifty} filter={filter} next={next} mode={mode} counts={counts} />
                    </VStack>
                </VStack>
            </VStack>
            <UserTopFifty scores={scores} summary={summary} type={filter === 'both' ? 'all' : filter} title={fiftyName} />
        </VStack>
    );
}

export default UserPumbility;

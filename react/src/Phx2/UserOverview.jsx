import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, Group, HStack, Image, NativeSelect, Progress, Separator, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Chart } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';

import { chartBallImg, gradeImg, stepballImg } from '../Helpers/assets';
import {
    COOP_MILESTONES, coopRating, DOUBLE_MILESTONES, gradeForScore, gradeLabel, progressAlong, pumbilityProgress, SINGLE_MILESTONES, typePumbility,
} from './pumbility';
import {
    ExpBar, FILL_TRANSITION, formatPumbility, GRADE_COLORS, Ladder, ladderPercent, PUMBILITY_LADDER, pumbilityTier, RankTag, TierName, TitleText,
    TINY, titleLadder, UnfilledFifty,
} from './shared';
import { levelRows } from './stats';

// Overview: progress toward the next PUMBILITY tier and singles and doubles titles, then how much
// of each level is cleared and how well, as a chart (bars: % of the level's charts cleared; line:
// average score of those clears).

const FILTERS = [['both', 'All'], ['s', 'Singles'], ['d', 'Doubles']];
const OVERVIEW_FILTERS = [...FILTERS, ['c', 'Co-op']];
const GREEN = 'rgb(4, 164, 35)';
const GREEN_FILL = 'rgba(4, 164, 35, 0.55)';
// stronger than the chart's bars: there's far less of a thin bar to show the color
const COOP_BAR_FILL = 'rgba(4, 164, 35, 0.7)';
const TEXT = '#a1a1aa';
const GRID = 'rgba(255, 255, 255, 0.06)';

// one size for every toggle and select beside it (Overview, score tables, Breakdown): smaller on phones.
// Set as styles: a responsive `size` doesn't take effect here.
export const FILTER_STYLE = { h: { base: '8', sm: '9' }, fontSize: { base: 'xs', sm: 'sm' } };
// the large number at the top right of that card
export const HERO_VALUE_STYLE = {
    fontFamily: "'Oxanium', sans-serif", fontWeight: '800', fontSize: { base: 'clamp(18px, 6.4vw, 24px)', sm: '3xl', md: '4xl' }, lineHeight: '1',
    fontVariantNumeric: 'tabular-nums', flexShrink: '0',
};
// the room above and below a card's progress bar, for the marker riding it: (the marker's 44px - the bar's 12px) / 2
export const HERO_BAR_MARGIN = '16px';
// the darker card a tab's progress and chart sit in (Overview, Breakdown)
export const PANEL_STYLE = { bg: 'bg.subtle', borderWidth: '1px', borderColor: 'border', borderRadius: 'lg', p: { base: '4', md: '6' } };

export function FilterButtons({ value, onChange, options = FILTERS }) {
    return (
        <Group attached>
            {options.map(([key, label]) => (
                <Button
                    key={key} size="sm" px={{ base: '1.5', sm: '3.5' }} {...FILTER_STYLE} colorPalette="phx2" variant={value === key ? 'solid' : 'outline'}
                    aria-pressed={value === key} onClick={() => onChange(key)}
                >
                    {label}
                </Button>
            ))}
        </Group>
    );
}

function levelLabel(filter, level) {
    return filter === 'both' ? String(level) : `${filter.toUpperCase()}${level}`;
}

// The same chart ranges for everyone by default, so players compare at a glance (as on Phoenix (1),
// which defaulted to its levels 1-28 and 850k-1M): levels 10-28, scores from 900k, lower only
// when an average shown is below that.
const DEFAULT_LEVELS = { from: 10, to: 28 };
const SCORE_AXIS_MIN = 900000;

// smaller tick text on narrow (phone-sized) charts
const narrow = (context) => context.chart.width < 500;
const tickFont = (context) => ({ size: narrow(context) ? 10 : 12 });

// the chart's title, and the one over Co-op's rows in its place
const TITLE = { color: '#e4e4e7', size: 16, weight: '600', gap: 8 };
// the chart's (Breakdown's too), and Co-op's rows in its place, so switching between them doesn't move the page
export const CHART_HEIGHT = { base: '260px', md: '340px' };
// on phones there's nothing under Co-op's rows (no date, or level range), so they also take that line's
// height and the gap above it; the same for Breakdown's chart, with nothing under it either
export const COOP_HEIGHT = { base: '308px', sm: CHART_HEIGHT.base, md: CHART_HEIGHT.md };
const LEGEND_SHORT = { 'Average score': 'Avg', '% cleared': 'Clear %' };
const TYPE_NAMES = { both: 'Singles and Doubles', s: 'Singles', d: 'Doubles' };

// faint lines across the chart where an average score reaches AAA (950k), S (970k) and SSS (990k),
// in those grades' colors
const GRADE_LINES = [[950000, GRADE_COLORS.aaa], [970000, GRADE_COLORS.s], [990000, GRADE_COLORS.sss]];
const gradeLines = {
    id: 'gradeLines',
    beforeDatasetsDraw(chart) {
        const { ctx, chartArea: { left, right }, scales: { score } } = chart;
        ctx.save();
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.globalAlpha = 0.45;
        for (const [value, color] of GRADE_LINES) {
            if (value < score.min || value > score.max) {
                continue;
            }
            const y = Math.round(score.getPixelForValue(value)) + 0.5;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();
        }
        ctx.restore();
    },
};
const CHART_PLUGINS = [gradeLines];

// titled as on Phoenix (1): "NAME (Singles and Doubles)", so a screenshot of the chart stands on its
// own (when it was synced sits under it, beside the level range)
function LevelChart({ rows, filter, info }) {
    // the tab's panel is still hidden as this mounts on opening the tab: created there, the chart would start
    // at no size, and everything in it would animate out from its top-left corner once the panel shows
    const box = useRef(null);
    const [sized, setSized] = useState(false);
    useEffect(() => {
        const observer = new ResizeObserver(([{ contentRect }]) => {
            if (contentRect.width > 0) {
                setSized(true);
                observer.disconnect();
            }
        });
        observer.observe(box.current);
        return () => observer.disconnect();
    }, []);

    const averages = rows.map((r) => r.average).filter(Boolean);
    const low = Math.min(SCORE_AXIS_MIN, ...averages.map((a) => Math.floor(a / 50000) * 50000));
    const data = {
        labels: rows.map((r) => levelLabel(filter, r.level)),
        datasets: [
            {
                type: 'line', label: 'Average score', data: rows.map((r) => r.average && Math.round(r.average)),
                yAxisID: 'score', borderColor: '#e4e4e7', backgroundColor: '#e4e4e7',
                // a finer line and smaller points on narrow charts, where the usual ones crowd the bars
                pointRadius: (c) => (narrow(c) ? 1.75 : 3), pointHoverRadius: (c) => (narrow(c) ? 3 : 4),
                pointBorderWidth: (c) => (narrow(c) ? 0 : 1), borderWidth: (c) => (narrow(c) ? 1.25 : 2),
                // drawn past the plot's edge, so averages near 1,000,000 aren't cut off at the top
                spanGaps: true, order: 0, clip: 8,
            },
            {
                type: 'bar', label: '% cleared', data: rows.map((r) => Math.round(r.percent * 10) / 10),
                yAxisID: 'percent', backgroundColor: GREEN_FILL, borderColor: GREEN, borderWidth: 1,
                borderRadius: 2, order: 1,
            },
        ],
    };
    const options = {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            title: {
                display: true, text: `${info.player} (${TYPE_NAMES[filter]})`,
                color: TITLE.color, font: { size: TITLE.size, weight: TITLE.weight }, padding: { top: 0, bottom: TITLE.gap },
            },
            legend: {
                labels: {
                    color: TEXT, boxWidth: 12,
                    // shorter names on narrow charts
                    generateLabels: (chart) => ChartJS.defaults.plugins.legend.labels.generateLabels(chart).map((item) => (
                        chart.width < 500 ? { ...item, text: LEGEND_SHORT[item.text] } : item
                    )),
                },
            },
            tooltip: {
                callbacks: {
                    label: (item) => {
                        const row = rows[item.dataIndex];
                        return item.dataset.yAxisID === 'percent'
                            ? ` ${item.formattedValue}% cleared (${row.cleared} of ${row.total})`
                            : ` Average ${row.average ? Math.round(row.average).toLocaleString() : '-'}`;
                    },
                },
            },
        },
        scales: {
            // every level label when they fit, every other (or fewer) when they'd overlap
            x: {
                ticks: { color: TEXT, font: tickFont, autoSkip: true, autoSkipPadding: 6, maxRotation: 0 }, grid: { color: GRID },
                // one axis title rather than "Lv." on every tick, which crowds narrow screens
                title: { display: true, text: 'Level', color: TEXT, font: tickFont, padding: { top: 4 } },
            },
            percent: {
                position: 'left', min: 0, max: 100,
                ticks: { color: TEXT, font: tickFont, callback: (v) => `${v}%` }, grid: { color: GRID },
            },
            score: {
                position: 'right', min: low, max: 1000000,
                ticks: { color: TEXT, font: tickFont, callback: (v) => (v >= 1000000 ? '1M' : `${Math.round(v / 1000)}k`) }, grid: { display: false },
            },
        },
    };
    return (
        <Box ref={box} h={CHART_HEIGHT}>
            {sized && <Chart type="bar" data={data} options={options} plugins={CHART_PLUGINS} />}
        </Box>
    );
}

// on very small screens the rows keep just the count and average, the bar already showing the percentage
const HIDE_WHEN_TINY = { [TINY]: { display: 'none' } };

// a step ball and bar, with how much is cleared and the average of those clears. On phones the numbers
// go under the bar.
function CoopRow({ ball, name, size = 'sm', filled, cleared, total, percent, average }) {
    const grade = average && gradeForScore(average);
    return (
        <HStack gap={{ base: '2.5', md: '3' }}>
            <Image src={ball} alt={name} title={name} boxSize={{ base: '34px', md: '40px' }} flexShrink="0" />
            <Flex flex="1" minW="0" direction={{ base: 'column', md: 'row' }} align={{ base: 'stretch', md: 'center' }} columnGap="4" rowGap="1.5">
                <Progress.Root flex="1" minW="0" size={size} value={filled ? percent : 0} aria-label={`${name} cleared`}>
                    <Progress.Track bg="bg.emphasized" borderRadius="full">
                        {/* no border on an empty bar, where it would draw as a green dot */}
                        <Progress.Range bg={COOP_BAR_FILL} borderWidth={filled && percent > 0 ? '1px' : '0'} borderColor={GREEN} borderRadius="full" transition={FILL_TRANSITION} />
                    </Progress.Track>
                </Progress.Root>
                {/* under the bar on phones and small tablets: spread across it, the count at its start */}
                {/* minH: the grade's height, so hiding it on very small screens doesn't change the row's */}
                <HStack justify="space-between" gap={{ base: '2', md: '3' }} flexShrink="0" minH="22px" fontSize={{ base: 'xs', sm: 'sm' }} fontVariantNumeric="tabular-nums" whiteSpace="nowrap">
                    <Text w={{ base: '8ch', md: '9ch' }} textAlign={{ base: 'start', md: 'end' }} title={`${cleared} of ${total} cleared`}>
                        {cleared} <Text as="span" color="fg.muted">/ {total}</Text>
                    </Text>
                    <Text w="5ch" textAlign="end" color="fg.muted" css={HIDE_WHEN_TINY}>{Math.round(percent)}%</Text>
                    <HStack w={{ base: '88px', sm: '104px', md: '118px' }} justify="end" gap={{ base: '1', md: '2' }} css={{ [TINY]: { width: 'auto' } }}>
                        <Text color={average ? 'fg' : 'fg.subtle'} title="Average score of the clears">
                            {average ? Math.round(average).toLocaleString() : '-'}
                        </Text>
                        <Box w={{ base: '30px', sm: '36px', md: '42px' }} flexShrink="0" css={HIDE_WHEN_TINY}>
                            {grade && <Image src={gradeImg('phx2', grade)} alt={gradeLabel(grade)} title={gradeLabel(grade)} h={{ base: '18px', sm: '22px', md: '24px' }} w="auto" mx="auto" />}
                        </Box>
                    </HStack>
                </HStack>
            </Flex>
        </HStack>
    );
}

// every co-op chart together: its average is of all the clears, so each player count weighs by its clears
function coopOverall(rows) {
    const cleared = rows.reduce((sum, row) => sum + row.cleared, 0);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    return {
        cleared, total,
        percent: total ? (100 * cleared) / total : 0,
        average: cleared ? rows.reduce((sum, row) => sum + row.cleared * (row.average || 0), 0) / cleared : null,
    };
}

// Co-op in place of the chart: too few player counts (x2 to x5) for one to show anything, so each gets a
// row, under one for all of them. Titled as the chart is, so a screenshot stands on its own.
function CoopRows({ rows, info }) {
    // fills from empty, as the chart's bars draw themselves in
    const [filled, setFilled] = useState(false);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setFilled(true));
        return () => cancelAnimationFrame(frame);
    }, []);
    return (
        <VStack align="stretch" h={COOP_HEIGHT} gap="0">
            <Text
                textAlign="center" color={TITLE.color} fontFamily={ChartJS.defaults.font.family} fontSize={`${TITLE.size}px`} fontWeight={TITLE.weight}
                lineHeight="1.2" pb={`${TITLE.gap}px`} flexShrink="0"
            >
                {info.player} (Co-op)
            </Text>
            <VStack align="stretch" flex="1" minH="0" justify="space-evenly" gap="0">
                {rows.length > 0 && (
                    <>
                        <CoopRow ball={stepballImg('phx2', 'c')} name="Co-op overall" size="md" filled={filled} {...coopOverall(rows)} />
                        <Separator borderColor="border" />
                    </>
                )}
                {rows.map(({ level, cleared, total, percent, average }) => (
                    <CoopRow
                        key={level} ball={chartBallImg('phx2', 'c', `n${level}`)} name={`Co-op x${level}`} filled={filled}
                        cleared={cleared} total={total} percent={percent} average={average}
                    />
                ))}
            </VStack>
        </VStack>
    );
}

function LevelSelect({ label, value, levels, onChange }) {
    return (
        <NativeSelect.Root size="sm" w="auto">
            <NativeSelect.Field
                aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}
                borderColor="phx2.emphasized" ps="2.5" pe="7" {...FILTER_STYLE}
            >
                {levels.map((level) => <option key={level} value={level}>Lv.{level}</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
        </NativeSelect.Root>
    );
}

// the chart's level range: DEFAULT_LEVELS until changed with From/To
function useLevelRange(rows) {
    const levels = rows.map((r) => r.level);
    const nearest = (level) => levels.reduce((best, l) => (Math.abs(l - level) < Math.abs(best - level) ? l : best), levels[0]);
    const [range, setRange] = useState(null);
    const from = range && levels.includes(range.from) ? range.from : nearest(DEFAULT_LEVELS.from);
    const to = range && levels.includes(range.to) ? range.to : nearest(DEFAULT_LEVELS.to);
    return {
        levels, from, to,
        setFrom: (level) => setRange({ from: level, to: Math.max(level, to) }),
        setTo: (level) => setRange({ from: Math.min(level, from), to: level }),
    };
}

// The Overview's headline: what's reached (a tier or title) and the rank large, the value larger,
// over the whole ladder with `marker` riding the fill
function LadderHero({ heading, rank, what, badge, value, progress, color, marker, markerSize, segments, ticks }) {
    return (
        <Box>
            <HStack justify="space-between" align="center" gap={{ base: '2', sm: '4' }} mb="1">
                {/* wraps rather than cut the heading short, but stays on one line on phones so the page's
                    height doesn't change with the screen's width: there the heading and value shrink with it,
                    and the heading is cut short only if it still doesn't fit */}
                <HStack gap="2.5" rowGap="0" minW="0" wrap={{ base: 'nowrap', sm: 'wrap' }}>
                    {heading}
                    {badge}
                </HStack>
                <Text
                    {...HERO_VALUE_STYLE}
                >
                    {formatPumbility(value)}
                </Text>
            </HStack>
            <ExpBar
                value={value} progress={progress} color={color} marker={marker} markerSize={markerSize} size="md"
                // the same room whatever the marker (tier icon or step ball), so switching views doesn't shift the page
                markerRoom={HERO_MARKER_ROOM}
                trackPercent={ladderPercent(segments, value)} track={(filled) => <Ladder segments={segments} filled={filled} ticks={ticks} />}
                // the ladder shows the way along; under it, the player's rank (if ranked) and what's left to the
                // next milestone
                points={false} footer={<RankLine rank={rank} what={what} />}
            />
        </Box>
    );
}

// "Rank #95", under a ladder; nothing for an unranked player (piugame lists the top 1,000, and shows "-" past that)
function RankLine({ rank, what }) {
    if (typeof rank !== 'number') {
        return null;
    }
    return (
        <Text flexShrink="0" title={`PUMBILITY ranking${what ? ` (${what})` : ''}`}>
            Rank <Text as="span" color="fg" fontWeight="semibold">#{rank.toLocaleString()}</Text>
        </Text>
    );
}

// smaller on phones, where the heading shares a line with the value
export const HEADING_SIZE = { base: 'clamp(13px, 4.3vw, 16px)', sm: 'lg', md: 'xl' };
// the tier icons' size, the largest marker
const HERO_MARKER_ROOM = 44;

// PUMBILITY along its tiers, each level a checkpoint, with the tier icon at the player's place
function PumbilityHero({ pumbility, counted, rank }) {
    const value = pumbility?.value ?? 0;
    const tier = pumbilityTier(pumbility);
    const progress = pumbilityProgress(value);
    return (
        <LadderHero
            heading={progress.current
                ? <TierName tier={progress.current.name} fontSize={HEADING_SIZE} lineHeight="1.3" />
                : <Text fontSize={HEADING_SIZE} fontWeight="bold" color="fg.muted">No tier yet</Text>}
            rank={rank}
            badge={<UnfilledFifty counted={counted} what="charts" color={tier.color} />}
            value={value} progress={progress} color={tier.color} marker={tier.icon} segments={PUMBILITY_LADDER}
        />
    );
}

// the step balls fill their image edge to edge, so they read larger than a tier icon of the same size
const STEPBALL_SIZE = 30;

const TYPES = {
    s: { label: 'Singles', color: 'red.500', milestones: SINGLE_MILESTONES, segments: titleLadder(SINGLE_MILESTONES) },
    d: { label: 'Doubles', color: 'green.500', milestones: DOUBLE_MILESTONES, segments: titleLadder(DOUBLE_MILESTONES) },
};
const RANKINGS = { s: 'singles', d: 'doubles' };

// singles or doubles PUMBILITY (its own best fifty) along piugame's titles, INTERMEDIATE to MASTER
function TitleHero({ info, scores, type }) {
    const { label, color, milestones, segments } = TYPES[type];
    const { total, counted } = useMemo(() => typePumbility(scores, type), [scores, type]);
    const progress = progressAlong(milestones, total);
    return (
        <LadderHero
            heading={progress.current
                ? <TitleText title={progress.current.title} fontSize={HEADING_SIZE} lineHeight="1.3" />
                : <Text fontSize={HEADING_SIZE} fontWeight="bold" color="fg.muted">No {label.toLowerCase()} title yet</Text>}
            rank={info.ranking?.[RANKINGS[type]]} what={label.toLowerCase()}
            badge={<UnfilledFifty counted={counted} what={label.toLowerCase()} color={color} />}
            value={total} progress={progress} color={color} marker={stepballImg('phx2', type)} markerSize={STEPBALL_SIZE}
            segments={segments} ticks
        />
    );
}

// singles and doubles PUMBILITY toward their next piugame titles ([S] EXPERT LV.6, DOUBLE MASTER, ...),
// side by side (the PUMBILITY tab)
export function TypeProgress({ info, scores }) {
    return (
        // side by side only once each has room for its title, rank and value on one line or so
        <SimpleGrid columns={{ base: 1, lg: 2 }} columnGap="10" rowGap="6">
            {Object.entries(TYPES).map(([type, { label, color, milestones }]) => (
                <TypeBar key={type} type={type} label={label} color={color} milestones={milestones} info={info} scores={scores} />
            ))}
        </SimpleGrid>
    );
}

function TypeBar({ type, label, color, milestones, info, scores }) {
    const { total, counted } = useMemo(() => typePumbility(scores, type), [scores, type]);
    return (
        <ExpBar
            label={label} labelColor={color} value={total} progress={progressAlong(milestones, total)}
            color={color} badge={<UnfilledFifty counted={counted} what={label.toLowerCase()} color={color} />}
            rank={<RankTag rank={info.ranking?.[RANKINGS[type]]} what={label.toLowerCase()} fontSize="sm" />}
            marker={stepballImg('phx2', type)} markerSize={STEPBALL_SIZE}
        />
    );
}

const COOP_SEGMENTS = titleLadder(COOP_MILESTONES);
// the titles that stand out, the first (LV.1) then ADVANCED, EXPERT and MASTER, whatever colors they share
const COOP_TICKS = [1000, 12000, 14000, 16000];

// CO-OP Rating along piugame's [CO-OP] titles, LV.1 to MASTER: unlike PUMBILITY, every clear counts
function CoopHero({ scores }) {
    const rating = useMemo(() => coopRating(scores), [scores]);
    const progress = progressAlong(COOP_MILESTONES, rating);
    return (
        <LadderHero
            heading={progress.current
                ? <TitleText title={progress.current.title} fontSize={HEADING_SIZE} lineHeight="1.3" />
                : <Text fontSize={HEADING_SIZE} fontWeight="bold" color="fg.muted">No co-op title yet</Text>}
            value={rating} progress={progress} color="yellow.400" marker={stepballImg('phx2', 'c')} markerSize={STEPBALL_SIZE}
            segments={COOP_SEGMENTS} ticks={COOP_TICKS}
        />
    );
}

// for All, PUMBILITY along its tiers; for Singles or Doubles, that type along its titles; for Co-op, its rating
function Progression({ info, scores, filter }) {
    const all = useMemo(() => typePumbility(scores), [scores]);
    if (filter === 'c') {
        return <CoopHero scores={scores} />;
    }
    if (filter === 'both') {
        return <PumbilityHero pumbility={info.pumbility} counted={all.counted} rank={info.ranking?.all} />;
    }
    return <TitleHero info={info} scores={scores} type={filter} />;
}

function UserOverview({ info, scores, counts, summary, filter, onFilterChange }) {
    const rows = useMemo(
        () => (counts ? levelRows(scores, counts, filter, summary.topFifty) : []),
        [scores, counts, filter, summary],
    );
    const range = useLevelRange(rows);
    const coop = filter === 'c';
    const chartRows = rows.filter((r) => r.level >= range.from && r.level <= range.to);

    return (
        <VStack align="stretch" gap="6">
            {/* All, Singles, Doubles or Co-op: picks the progress shown, the chart's charts and the score tables' */}
            <VStack align="stretch" gap="3">
                <FilterButtons value={filter} onChange={onFilterChange} options={OVERVIEW_FILTERS} />
                {/* one panel holds the progress bar and, below a divider, the chart and its level range */}
                <VStack
                    align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />} {...PANEL_STYLE}
                >
                    <Progression info={info} scores={scores} filter={filter} />
                    <VStack align="stretch" gap="4">
                        {coop ? <CoopRows rows={rows} info={info} /> : <LevelChart rows={chartRows} filter={filter} info={info} />}
                        {/* one line, as tall as the selects even on Co-op, which has none. No date on phones, where
                            it wouldn't fit beside them: the header says when it was synced */}
                        <HStack display={{ base: coop ? 'none' : 'flex', sm: 'flex' }} justify="space-between" gap="3" minH={FILTER_STYLE.h} fontSize="sm" color="fg.muted">
                            <Text display={{ base: 'none', sm: 'block' }} fontSize="xs" fontStyle="italic" minW="0" truncate>
                                Synced: {new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                            {rows.length > 0 && !coop && (
                                <HStack gap="2" ms="auto" flexShrink="0" css={{ [TINY]: { gap: '4px' } }}>
                                    <LevelSelect label="From level" value={range.from} levels={range.levels} onChange={range.setFrom} />
                                    <Text css={HIDE_WHEN_TINY}>to</Text>
                                    <LevelSelect label="To level" value={range.to} levels={range.levels} onChange={range.setTo} />
                                </HStack>
                            )}
                        </HStack>
                    </VStack>
                </VStack>
            </VStack>
        </VStack>
    );
}

export default UserOverview;

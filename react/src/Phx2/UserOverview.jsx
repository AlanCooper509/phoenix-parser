import { useMemo, useState } from 'react';
import { Box, Button, Group, HStack, NativeSelect, Separator, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

import { stepballImg } from '../Helpers/assets';
import { DOUBLE_MILESTONES, progressAlong, pumbilityProgress, SINGLE_MILESTONES, typePumbility } from './pumbility';
import {
    ExpBar, formatPumbility, Ladder, ladderPercent, PUMBILITY_LADDER, pumbilityTier, RankTag, TierName, TitleText, titleLadder, UnfilledFifty,
} from './shared';
import { levelRows } from './stats';

// Overview: progress toward the next PUMBILITY tier and singles and doubles titles, then how much
// of each level is cleared and how well, as a chart (bars: % of the level's charts cleared; line:
// average score of those clears).

const FILTERS = [['both', 'All'], ['s', 'Singles'], ['d', 'Doubles']];
const GREEN = 'rgb(4, 164, 35)';
const TEXT = '#a1a1aa';
const GRID = 'rgba(255, 255, 255, 0.06)';

export function FilterButtons({ value, onChange, options = FILTERS }) {
    return (
        // as tall as the level selects beside them
        <Group attached>
            {options.map(([key, label]) => (
                <Button
                    key={key} size="sm" colorPalette="phx2" variant={value === key ? 'solid' : 'outline'}
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

const TYPE_NAMES = { both: 'Singles and Doubles', s: 'Singles', d: 'Doubles' };

// titled as on Phoenix (1): "NAME (Singles and Doubles)", so a screenshot of the chart stands on its
// own (when it was synced sits under it, beside the level range)
function LevelChart({ rows, filter, info }) {
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
                yAxisID: 'percent', backgroundColor: 'rgba(4, 164, 35, 0.55)', borderColor: GREEN, borderWidth: 1,
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
                color: '#e4e4e7', font: { size: 16, weight: '600' }, padding: { top: 0, bottom: 8 },
            },
            legend: { labels: { color: TEXT, boxWidth: 12 } },
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
        <Box h={{ base: '260px', md: '340px' }}>
            <Chart type="bar" data={data} options={options} />
        </Box>
    );
}

function LevelSelect({ label, value, levels, onChange }) {
    return (
        <NativeSelect.Root size="sm" w="auto">
            <NativeSelect.Field
                aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))}
                borderColor="phx2.emphasized" ps="2.5" pe="7"
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
            <HStack justify="space-between" align="center" gap="4" mb="1">
                {/* wraps rather than cut the heading short */}
                <HStack gap="2.5" rowGap="0" minW="0" wrap="wrap">
                    {heading}
                    {badge}
                </HStack>
                <Text
                    fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize={{ base: '3xl', md: '4xl' }} lineHeight="1"
                    fontVariantNumeric="tabular-nums" flexShrink="0"
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

// "Rank #95", under a ladder; nothing for an unranked player
function RankLine({ rank, what }) {
    if (rank === null || rank === undefined || rank === '') {
        return null;
    }
    return (
        <Text flexShrink="0" title={`PUMBILITY ranking${what ? ` (${what})` : ''}`}>
            Rank <Text as="span" color="fg" fontWeight="semibold">{typeof rank === 'number' ? `#${rank.toLocaleString()}` : rank}</Text>
        </Text>
    );
}

const HEADING_SIZE = { base: 'lg', md: 'xl' };
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

// for All, PUMBILITY along its tiers; for Singles or Doubles, that type along its titles
function Progression({ info, scores, filter }) {
    const all = useMemo(() => typePumbility(scores), [scores]);
    if (filter === 'both') {
        return <PumbilityHero pumbility={info.pumbility} counted={all.counted} rank={info.ranking?.all} />;
    }
    return <TitleHero info={info} scores={scores} type={filter} />;
}

function UserOverview({ info, scores, counts, summary }) {
    const [filter, setFilter] = useState('both');
    const rows = useMemo(
        () => (counts ? levelRows(scores, counts, filter, summary.topFifty) : []),
        [scores, counts, filter, summary],
    );
    const range = useLevelRange(rows);
    const chartRows = rows.filter((r) => r.level >= range.from && r.level <= range.to);

    return (
        <VStack align="stretch" gap="6">
            {/* All, Singles or Doubles: picks both the progress shown and the chart's charts */}
            <VStack align="stretch" gap="3">
                <FilterButtons value={filter} onChange={setFilter} />
                {/* one panel holds the progress bar and, below a divider, the chart and its level range */}
                <VStack
                    align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />}
                    bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="lg" p={{ base: '4', md: '6' }}
                >
                    <Progression info={info} scores={scores} filter={filter} />
                    <VStack align="stretch" gap="4">
                        <LevelChart rows={chartRows} filter={filter} info={info} />
                        <HStack justify="space-between" wrap="wrap" gap="3" fontSize="sm" color="fg.muted">
                            <Text fontSize="xs" fontStyle="italic">
                                Synced: {new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </Text>
                            {rows.length > 0 && (
                                <HStack gap="2" ms="auto">
                                    <LevelSelect label="From level" value={range.from} levels={range.levels} onChange={range.setFrom} />
                                    <Text>to</Text>
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

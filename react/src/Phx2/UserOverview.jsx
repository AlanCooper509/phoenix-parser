import { useMemo, useState } from 'react';
import { Box, Button, Group, HStack, NativeSelect, Separator, SimpleGrid, Text, VStack } from '@chakra-ui/react';
import { Chart } from 'react-chartjs-2';
import 'chart.js/auto';

import { stepballImg } from '../Helpers/assets';
import { DOUBLE_MILESTONES, progressAlong, pumbilityProgress, SINGLE_MILESTONES, typePumbility } from './pumbility';
import { ExpBar, formatPumbility, pumbilityTier, RankTag, TierName, UnfilledFifty } from './shared';
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
const tickFont = (context) => ({ size: context.chart.width < 500 ? 10 : 12 });

const TYPE_NAMES = { both: 'Singles and Doubles', s: 'Singles', d: 'Doubles' };

// titled as on Phoenix (1): "NAME (Singles and Doubles)", with when it was synced, so a screenshot
// of the chart stands on its own
function LevelChart({ rows, filter, info }) {
    const averages = rows.map((r) => r.average).filter(Boolean);
    const low = Math.min(SCORE_AXIS_MIN, ...averages.map((a) => Math.floor(a / 50000) * 50000));
    const data = {
        labels: rows.map((r) => levelLabel(filter, r.level)),
        datasets: [
            {
                type: 'line', label: 'Average score', data: rows.map((r) => r.average && Math.round(r.average)),
                yAxisID: 'score', borderColor: '#e4e4e7', backgroundColor: '#e4e4e7', pointRadius: 3, borderWidth: 2,
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
                color: '#e4e4e7', font: { size: 16, weight: '600' }, padding: { top: 0, bottom: 2 },
            },
            subtitle: {
                display: true, text: `Last synced ${new Date(info.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                align: 'end', color: TEXT, font: { size: 12, style: 'italic' }, padding: { bottom: 8 },
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

// PUMBILITY as the headline: its tier and total large, over a thicker bar with the tier icon
// riding the fill
function PumbilityHero({ pumbility, counted, rank }) {
    const value = pumbility?.value ?? 0;
    const tier = pumbilityTier(pumbility);
    const progress = pumbilityProgress(value);
    return (
        <Box>
            <HStack justify="space-between" align="center" gap="4" mb="1">
                <HStack gap="2.5" minW="0">
                    {progress.current
                        ? <TierName tier={progress.current.name} fontSize={{ base: 'lg', md: 'xl' }} lineHeight="1.3" />
                        : <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="fg.muted">No tier yet</Text>}
                    <RankTag rank={rank} fontSize={{ base: 'md', md: 'lg' }} />
                    <UnfilledFifty counted={counted} what="charts" color={tier.color} />
                </HStack>
                <Text
                    fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize={{ base: '3xl', md: '4xl' }} lineHeight="1"
                    fontVariantNumeric="tabular-nums" flexShrink="0"
                >
                    {formatPumbility(value)}
                </Text>
            </HStack>
            <ExpBar
                value={value} progress={progress} color={tier.color}
                marker={tier.icon} markerRoom size="md"
            />
        </Box>
    );
}

// the step balls fill their image edge to edge, so they read larger than a tier icon of the same size
const STEPBALL_SIZE = 30;

// PUMBILITY toward its next tier, then singles and doubles PUMBILITY (each its own best fifty)
// toward their next piugame titles ([S] EXPERT LV.6, DOUBLE MASTER, ...)
function Progression({ info, scores }) {
    const all = useMemo(() => typePumbility(scores), [scores]);
    const singles = useMemo(() => typePumbility(scores, 's'), [scores]);
    const doubles = useMemo(() => typePumbility(scores, 'd'), [scores]);
    return (
        // PUMBILITY above a divider, singles and doubles below
        <VStack align="stretch" gap="5" separator={<Separator />}>
            <PumbilityHero pumbility={info.pumbility} counted={all.counted} rank={info.ranking?.all} />
            <SimpleGrid columns={{ base: 1, md: 2 }} columnGap="10" rowGap="6">
                <ExpBar
                    label="Singles" labelColor="red.500" value={singles.total} progress={progressAlong(SINGLE_MILESTONES, singles.total)}
                    color="red.500" badge={<UnfilledFifty counted={singles.counted} what="singles" color="red.500" />}
                    rank={<RankTag rank={info.ranking?.singles} what="singles" fontSize="sm" />}
                    marker={stepballImg('phx2', 's')} markerSize={STEPBALL_SIZE}
                />
                <ExpBar
                    label="Doubles" labelColor="green.500" value={doubles.total} progress={progressAlong(DOUBLE_MILESTONES, doubles.total)}
                    color="green.500" badge={<UnfilledFifty counted={doubles.counted} what="doubles" color="green.500" />}
                    rank={<RankTag rank={info.ranking?.doubles} what="doubles" fontSize="sm" />}
                    marker={stepballImg('phx2', 'd')} markerSize={STEPBALL_SIZE}
                />
            </SimpleGrid>
        </VStack>
    );
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
            {/* one panel holds the progress bars and, below a divider, the chart and its controls */}
            <VStack align="stretch" gap="3">
                <VStack
                    align="stretch" gap="8" separator={<Separator borderColor="border.emphasized" borderTopWidth="2px" />}
                    bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="lg" p={{ base: '4', md: '6' }}
                >
                    <Progression info={info} scores={scores} />
                    <VStack align="stretch" gap="4">
                        <LevelChart rows={chartRows} filter={filter} info={info} />
                        <HStack justify="space-between" wrap="wrap" gap="3">
                            <FilterButtons value={filter} onChange={setFilter} />
                            {rows.length > 0 && (
                                <HStack gap="2" fontSize="sm" color="fg.muted">
                                    <Text>Levels</Text>
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

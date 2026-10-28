import { useMemo } from 'react';
import { Box, Heading, HStack, Image, Table, Text, VStack } from '@chakra-ui/react';

import { ChartBadge, ExpBar, formatPumbility, pumbilityTier, TierName } from './shared';
import { pumbilityProgress } from './pumbility';
import { newChartTargets } from './stats';
import { TypeProgress } from './UserOverview';

// PUMBILITY: where a player's total comes from and what it takes for a chart to count. Values use the Phoenix 2 formula (see pumbility.js).

function Section({ title, description, children }) {
    return (
        <VStack align="stretch" gap="3">
            <Box>
                <Heading as="h2" size="lg">{title}</Heading>
                {description && <Text color="fg.muted" fontSize="sm" mt="1">{description}</Text>}
            </Box>
            {children}
        </VStack>
    );
}

// mirrors piugame's own PUMBILITY box: tier icon, tier and total, with how far it is to the next level
function Total({ pumbility, summary }) {
    const tier = pumbilityTier(pumbility);
    const value = pumbility?.value ?? summary.total;
    return (
        <HStack gap="4">
            {tier.icon && <Image src={tier.icon} alt="" boxSize={{ base: '72px', md: '96px' }} my="-3" />}
            <Box flex="1" minW="0">
                {pumbility?.tier && <TierName tier={pumbility.tier} fontSize={{ base: 'md', md: 'lg' }} />}
                <Text fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize={{ base: '3xl', md: '4xl' }} lineHeight="1.1" fontVariantNumeric="tabular-nums">
                    {formatPumbility(value)}
                </Text>
                <ExpBar
                    value={value} progress={pumbilityProgress(value)} color={tier.color} maxW="480px" mt="2" mb="1"
                />
                {/* until 50 charts are cleared there's no 50th best to beat: every clear counts */}
                <Text color="fg.muted" fontSize="sm" mt="1">
                    {summary.topScores.length < 50 ? (
                        <>
                            The sum of your best 50 charts. With {summary.topScores.length} cleared so far, every new clear
                            (of a single or double, Lv.10 and up) adds to it.
                        </>
                    ) : (
                        <>
                            The sum of your best 50 charts. A chart counts once it's worth more than your 50th best,{' '}
                            <Text as="span" color="fg" fontWeight="semibold">{formatPumbility(summary.floor)}</Text>.
                        </>
                    )}
                </Text>
            </Box>
        </HStack>
    );
}

// how many of the best 50, and how many points, come from each level of singles and doubles
function Sources({ topScores, values }) {
    const groups = new Map();
    for (const score of topScores) {
        const key = `${score.type}${Number(score.level)}`;
        const group = groups.get(key) || { type: score.type, level: Number(score.level), count: 0, points: 0 };
        group.count += 1;
        group.points += values.get(score);
        groups.set(key, group);
    }
    const rows = [...groups.values()].sort((a, b) => b.points - a.points);
    const most = Math.max(...rows.map((r) => r.count));
    return (
        <VStack align="stretch" gap="2">
            {rows.map((row) => (
                <HStack key={`${row.type}${row.level}`} gap="3">
                    <ChartBadge type={row.type} level={row.level} w="10" justifyContent="center" flexShrink="0" />
                    <Box flex="1" minW="0">
                        <Box h="2" w={`${(100 * row.count) / most}%`} minW="2" bg="phx2.solid" borderRadius="full" />
                    </Box>
                    <Text w="8ch" textAlign="end" fontVariantNumeric="tabular-nums" flexShrink="0">
                        {row.count} {row.count === 1 ? 'chart' : 'charts'}
                    </Text>
                    <Text w="9ch" textAlign="end" fontVariantNumeric="tabular-nums" color="fg.muted" flexShrink="0">
                        {formatPumbility(row.points)}
                    </Text>
                </HStack>
            ))}
        </VStack>
    );
}

function NewCharts({ targets }) {
    if (!targets.length) {
        return <Text color="fg.muted">No unplayed charts can reach your best 50 yet.</Text>;
    }
    return (
        <Table.ScrollArea>
            <Table.Root size="sm" variant="line">
                <Table.Header>
                    <Table.Row>
                        <Table.ColumnHeader>Level</Table.ColumnHeader>
                        <Table.ColumnHeader>Grade needed</Table.ColumnHeader>
                        <Table.ColumnHeader textAlign="end">Unplayed</Table.ColumnHeader>
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {targets.map(({ type, level, grade, unplayed }) => (
                        <Table.Row key={`${type}${level}`}>
                            <Table.Cell><ChartBadge type={type} level={level} /></Table.Cell>
                            <Table.Cell fontVariantNumeric="tabular-nums">
                                {grade[1]} <Text as="span" color="fg.muted" fontSize="sm">({grade[2].toLocaleString()}+)</Text>
                            </Table.Cell>
                            <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">{unplayed}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table.Root>
        </Table.ScrollArea>
    );
}

function UserPumbility({ scores, counts, summary, info }) {
    const { pumbility } = info;
    const targets = useMemo(() => (counts ? newChartTargets(scores, counts, summary.floor) : []), [scores, counts, summary]);

    return (
        <VStack align="stretch" gap="10">
            <VStack align="stretch" gap="8">
                <Total pumbility={pumbility} summary={summary} />
                {/* each toward its next title (the Overview shows the whole way) */}
                <TypeProgress info={info} scores={scores} />
            </VStack>

            <Section title="Where it comes from" description="Your best 50 charts by level, and the points each level adds.">
                <Sources topScores={summary.topScores} values={summary.valueOf} />
            </Section>

            {/* below 50 charts counting, any clear makes the best 50: the per-level table would be all F */}
            {summary.topScores.length < 50 ? (
                <Section title="New charts that would count">
                    <Text color="fg.muted">
                        Until your best 50 is full, the first clear of any single or double from Lv.10 counts, and higher
                        levels are worth more.
                    </Text>
                </Section>
            ) : (
                <Section title="New charts that would count" description="The grade a first clear needs to make your best 50, by level.">
                    <NewCharts targets={targets} />
                </Section>
            )}

        </VStack>
    );
}

export default UserPumbility;

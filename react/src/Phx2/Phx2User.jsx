import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Box, Center, Container, EmptyState, Heading, HStack, Image, Spinner, Tabs, Text, VStack } from '@chakra-ui/react';
import { LuUserX } from 'react-icons/lu';

import getUser from '../API/user';
import getChartStats from '../API/chartstats';
import { fromPiugameUrl } from '../Helpers/assets';
import { userPath } from '../Helpers/paths';
import { TAB_SIZES, WIDE_PAGE_WIDTH, WinterSnow, Phx2Layout, PhoneShort, PlayerTitle, pumbilityTier, TierName, timeAgo } from './shared';
import { pumbilitySummary } from './stats';
import UserOverview from './UserOverview';
import UserPumbility from './UserPumbility';
import UserScores from './UserScores';
import UserTopFifty from './UserTopFifty';
import UserBreakdown from './UserBreakdown';
import SyncPanel, { SyncForm } from './SyncForm';

// PROTOTYPE: a player's Phoenix 2 page at /phx2/user/NAME/NUM(/tab), from their latest sync.
// The URL holds the tab, so back/forward switch tabs as on the Phoenix (1) user page. Only the open
// tab is rendered, so each mounts fresh when opened and its chart and bars animate in again.
// [value, label, label on phones]
const TABS = [['overview', 'Overview'], ['breakdown', 'Breakdown'], ['pumbility', 'PUMBILITY']];

// where links to a tab that's since moved now go: Recently Played was its own tab, then under Scores,
// whose tables are now at the bottom of Overview and PUMBILITY
function movedTabPath(tab, view) {
    if (tab === 'recent' || (view === 'recent' && (tab === 'scores' || tab === 'overview'))) {
        return 'overview?view=recent';
    }
    if (tab === 'scores') {
        return view === 'pumbility' ? 'pumbility' : 'overview';
    }
    return null;
}

function Profile({ info }) {
    const tier = pumbilityTier(info.pumbility);
    return (
        // sized down on phones (and kept compact on desktop) so the header stays short and nothing truncates
        <HStack gap={{ base: '3', md: '5' }} align="center" flex="1" minW="0">
            {/* piugame avatars are 200x150: shown whole at 4:3 */}
            <Image
                src={fromPiugameUrl(info.avatar)} alt="" w={{ base: '80px', sm: '104px', md: '136px' }} aspectRatio="4 / 3" flexShrink="0"
                objectFit="contain" borderRadius="md" bg="bg.muted"
                onError={(e) => { if (e.currentTarget.src !== info.avatar) e.currentTarget.src = info.avatar; }}
            />
            <VStack align="start" gap={{ base: '0.5', md: '1' }} minW="0" flex="1">
                <PlayerTitle title={info.title} fontSize={{ base: '13px', sm: '15px', md: '18px' }} lineHeight="1.3" maxW="full" />
                <Heading as="h1" fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize={{ base: 'xl', sm: '2xl', md: '3xl' }} lineHeight="1.1" truncate maxW="full">
                    {info.player} <Text as="span" color="fg.muted">{info.number}</Text>
                </Heading>
                {/* pulled up past the empty space under the name's capitals, so it sits evenly between
                    the title and the PUMBILITY row */}
                {info.pumbility && (
                    <HStack gap={{ base: '1.5', md: '2' }} mt={{ base: '-0.5', md: '-1' }} minW="0" maxW="full">
                        {tier.icon && <Image src={tier.icon} alt="" boxSize={{ base: '26px', md: '32px' }} my="-1" ms="-0.5" flexShrink="0" />}
                        {/* the total itself is in the PUMBILITY panel below (and on the PUMBILITY tab) */}
                        {info.pumbility.tier && <TierName tier={info.pumbility.tier} fontSize={{ base: 'sm', md: 'md' }} />}
                    </HStack>
                )}
                {/* cut short rather than take a second line, which would change the header's height */}
                <Text fontSize={{ base: 'xs', md: 'sm' }} color="fg.muted" truncate maxW="full" title={new Date(info.timestamp * 1000).toLocaleString()}>
                    Last synced {timeAgo(info.timestamp)}
                </Text>
            </VStack>
        </HStack>
    );
}

// Overview's All / Singles / Doubles / Co-op as it reads in the URL (?type=coop; nothing for All)
const FILTER_PARAMS = { s: 'singles', d: 'doubles', c: 'coop' };

// one All / Singles / Doubles / Co-op, at the top, for everything on the tab, kept in the URL so a shared
// link opens on it
function OverviewTab({ user, counts, summary }) {
    const [params, setParams] = useSearchParams();
    const filter = Object.keys(FILTER_PARAMS).find((key) => FILTER_PARAMS[key] === params.get('type')) ?? 'both';
    const setFilter = (next) => setParams((current) => {
        const updated = new URLSearchParams(current);
        if (FILTER_PARAMS[next]) {
            updated.set('type', FILTER_PARAMS[next]);
        } else {
            updated.delete('type');
        }
        return updated;
    }, { replace: true });
    return (
        <VStack align="stretch" gap="10">
            <UserOverview info={user.info} scores={user.scores} counts={counts} summary={summary} filter={filter} onFilterChange={setFilter} />
            <UserScores user={user} summary={summary} filter={filter} />
        </VStack>
    );
}

function Phx2User() {
    const { name, number, tab = 'overview', view } = useParams();
    const navigate = useNavigate();
    const moved = movedTabPath(tab, view);
    useEffect(() => {
        if (moved) {
            navigate(userPath('phx2', name, number, moved), { replace: true });
        }
    }, [moved, name, number, navigate]);
    const [user, setUser] = useState(null);
    const [status, setStatus] = useState('loading');
    const [counts, setCounts] = useState(null);

    useEffect(() => {
        setStatus('loading');
        getUser('phx2', name, number)
            .then((data) => { setUser(data); setStatus('ready'); })
            .catch((error) => setStatus(error.response?.status === 404 ? 'missing' : 'error'));
    }, [name, number]);

    useEffect(() => {
        getChartStats('phx2').then(setCounts).catch(() => setCounts({}));
    }, []);

    const summary = useMemo(() => (user ? pumbilitySummary(user.scores) : null), [user]);

    let content;
    if (status === 'loading') {
        content = <Center py="20"><Spinner size="lg" color="phx2.fg" /></Center>;
    } else if (status !== 'ready') {
        content = (
            <EmptyState.Root>
                <EmptyState.Content>
                    <EmptyState.Indicator><LuUserX /></EmptyState.Indicator>
                    <EmptyState.Title>
                        {status === 'missing' ? `${name} #${number} hasn't synced Phoenix 2 yet` : "Couldn't load this player right now"}
                    </EmptyState.Title>
                    <EmptyState.Description>
                        {status === 'missing' ? 'If this is you, sync your data from piugame.com to create your page.' : 'Try again later.'}
                    </EmptyState.Description>
                    {status === 'missing' && (
                        <Box w="full" maxW="360px" mt="2">
                            <SyncForm name={name} number={number} onSynced={(synced) => { setUser(synced); setStatus('ready'); }} />
                        </Box>
                    )}
                </EmptyState.Content>
            </EmptyState.Root>
        );
    } else {
        content = (
            <VStack align="stretch" gap="2">
                {/* syncing it again, in the top-right corner */}
                <Box position="relative">
                    <WinterSnow snowflakeCount={25} wind={[-0.3, 0.6]} speed={[0.5, 0.8]} />
                    <SyncPanel info={user.info} name={name} number={number} onSynced={setUser}>
                        <Profile info={user.info} />
                    </SyncPanel>
                </Box>
                <Tabs.Root
                    value={tab} onValueChange={(e) => navigate(userPath('phx2', name, number, e.value))}
                    variant="line" colorPalette="phx2"
                >
                    <Tabs.List>
                        {TABS.map(([value, label, short]) => (
                            <Tabs.Trigger key={value} value={value} css={TAB_SIZES} whiteSpace="nowrap">
                                {short ? <PhoneShort long={label} short={short} /> : label}
                            </Tabs.Trigger>
                        ))}
                    </Tabs.List>
                    <Tabs.Content value="overview" pt="6">
                        {tab === 'overview' && <OverviewTab user={user} counts={counts} summary={summary} />}
                    </Tabs.Content>
                    <Tabs.Content value="breakdown" pt="6">
                        {tab === 'breakdown' && <UserBreakdown name={name} number={number} view={view} scores={user.scores} counts={counts} info={user.info} />}
                    </Tabs.Content>
                    <Tabs.Content value="pumbility" pt="6">
                        {tab === 'pumbility' && (
                            <VStack align="stretch" gap="10">
                                <UserPumbility scores={user.scores} counts={counts} summary={summary} info={user.info} />
                                <UserTopFifty scores={user.scores} summary={summary} />
                            </VStack>
                        )}
                    </Tabs.Content>
                </Tabs.Root>
            </VStack>
        );
    }

    return (
        <Phx2Layout width={WIDE_PAGE_WIDTH}>
            <Container css={WIDE_PAGE_WIDTH} px={{ base: '4', md: '6' }} py={{ base: '6', md: '10' }}>
                <Box>{content}</Box>
            </Container>
        </Phx2Layout>
    );
}

export default Phx2User;

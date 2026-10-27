import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Center, Container, EmptyState, Heading, HStack, Image, Spinner, Tabs, Text, VStack } from '@chakra-ui/react';
import { LuUserX } from 'react-icons/lu';

import getUser from '../API/user';
import getChartStats from '../API/chartstats';
import { fromPiugameUrl } from '../Helpers/assets';
import { userPath } from '../Helpers/paths';
import { TAB_SIZES, WIDE_PAGE_WIDTH, Phx2Layout, PhoneShort, PlayerTitle, pumbilityTier, TierName, timeAgo } from './shared';
import { pumbilitySummary } from './stats';
import UserOverview from './UserOverview';
import UserPumbility from './UserPumbility';
import UserBestScores from './UserBestScores';
import UserRecent from './UserRecent';
import SyncPanel, { SyncForm } from './SyncForm';

// PROTOTYPE: a player's Phoenix 2 page at /phx2/user/NAME/NUM(/tab), from their latest sync.
// The URL holds the tab, so back/forward switch tabs as on the Phoenix (1) user page. Only the open
// tab is rendered, so each mounts fresh when opened and its chart and bars animate in again.
// [value, label, label on phones]
const TABS = [['overview', 'Overview'], ['scores', 'Best Scores', 'Scores'], ['recent', 'Recently Played', 'Recent'], ['pumbility', 'PUMBILITY']];

function Profile({ info }) {
    const tier = pumbilityTier(info.pumbility);
    return (
        <HStack gap={{ base: '4', md: '6' }} align="center" flex="1" minW="0">
            {/* piugame avatars are 200x150: shown whole at 4:3 */}
            <Image
                src={fromPiugameUrl(info.avatar)} alt="" w={{ base: '96px', sm: '112px', md: '160px' }} aspectRatio="4 / 3" flexShrink="0"
                objectFit="contain" borderRadius="md" bg="bg.muted"
                onError={(e) => { if (e.currentTarget.src !== info.avatar) e.currentTarget.src = info.avatar; }}
            />
            <VStack align="start" gap="1" minW="0" flex="1">
                <PlayerTitle title={info.title} fontSize={{ base: '16px', md: '20px' }} lineHeight="1.3" maxW="full" />
                <Heading as="h1" fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize={{ base: '2xl', md: '4xl' }} lineHeight="1.1">
                    {info.player} <Text as="span" color="fg.muted">{info.number}</Text>
                </Heading>
                {/* pulled up past the empty space under the name's capitals, so it sits evenly between
                    the title and the PUMBILITY row */}
                {info.pumbility && (
                    <HStack gap="2" mt={{ base: '-1', md: '-1.5' }}>
                        {tier.icon && <Image src={tier.icon} alt="" boxSize="36px" my="-1.5" ms="-1" />}
                        {/* the total itself is in the PUMBILITY panel below (and on the PUMBILITY tab) */}
                        {info.pumbility.tier && <TierName tier={info.pumbility.tier} />}
                    </HStack>
                )}
                <Text fontSize="sm" color="fg.muted" title={new Date(info.timestamp * 1000).toLocaleString()}>
                    Last synced {timeAgo(info.timestamp)}
                </Text>
            </VStack>
        </HStack>
    );
}

function Phx2User() {
    const { name, number, tab = 'overview' } = useParams();
    const navigate = useNavigate();
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
            <VStack align="stretch" gap="8">
                {/* syncing it again, in the top-right corner */}
                <SyncPanel info={user.info} name={name} number={number} onSynced={setUser}>
                    <Profile info={user.info} />
                </SyncPanel>
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
                        {tab === 'overview' && <UserOverview info={user.info} scores={user.scores} counts={counts} summary={summary} />}
                    </Tabs.Content>
                    <Tabs.Content value="scores" pt="6">
                        {tab === 'scores' && <UserBestScores scores={user.scores} summary={summary} />}
                    </Tabs.Content>
                    <Tabs.Content value="recent" pt="6">
                        {tab === 'recent' && <UserRecent recents={user.recents || []} />}
                    </Tabs.Content>
                    <Tabs.Content value="pumbility" pt="6">
                        {tab === 'pumbility' && <UserPumbility scores={user.scores} counts={counts} summary={summary} pumbility={user.pumbility} />}
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

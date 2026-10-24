import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    ChakraProvider, Theme,
    Badge, Box, Card, Container, EmptyState, Flex, Heading, HStack, Input, InputGroup,
    Image, Link, SimpleGrid, Skeleton, Tabs, Text, VStack,
} from '@chakra-ui/react';
import { LuSearch, LuUsers } from 'react-icons/lu';

import getUsers from '../API/users';
import { fromPiugameUrl, pumbilityImg } from '../Helpers/assets';
import system from './theme';
import './Phx2Home.css';

// PROTOTYPE: Phoenix 2 home page in Chakra UI (dark), at /phx2. Chakra only wraps this route,
// so the Bootstrap pages are untouched.

const DAY = 24 * 60 * 60;

// Cards are >= 380px wide, as many per row as fit, and the page widens in steps so they never
// stretch much past that: 1 per row in a 480px page, 2 in an 880px page from an 840px-wide screen
// (where two first fit), 3 in a 1248px page from 1280px. Every card stays ~390-430px, leaving the
// title ~220px next to the avatar and tier icon: room for ~94% of Phoenix 2 titles at 14px; longer
// ones are truncated, with the full title on hover. Phones get the single column at full width.
const CARD_COLUMNS = 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))';
const PAGE_WIDTH = {
    maxWidth: '480px',
    '@media screen and (min-width: 840px)': { maxWidth: '880px' },
    '@media screen and (min-width: 1280px)': { maxWidth: '1248px' },
};

// Player titles styled as on piugame.com's profile page: Oxanium, weight 900, a thin white outline
// around a gradient fill (bright at the bottom, dark at the top) per color class col1..col9;
// col0 is plain gray without the outline. Truncated to one line, with the full title on hover.
const TITLE_GRADIENTS = {
    col1: ['rgb(215, 152, 103)', 'rgb(99, 69, 46)'],
    col2: ['rgb(228, 245, 248)', 'rgb(114, 120, 120)'],
    col3: ['rgb(251, 245, 45)', 'rgb(194, 143, 38)'],
    col4: ['rgb(215, 255, 255)', 'rgb(109, 163, 239)'],
    col5: ['rgb(0, 162, 255)', 'rgb(0, 67, 114)'],
    col6: ['rgb(255, 0, 0)', 'rgb(105, 0, 0)'],
    col7: ['rgb(202, 57, 255)', 'rgb(89, 24, 114)'],
    col8: ['rgb(90, 90, 90)', 'rgb(42, 44, 44)'],
    col9: ['rgb(0, 66, 207)', 'rgb(0, 27, 82)'],
};

function PlayerTitle({ title, ...props }) {
    const gradient = TITLE_GRADIENTS[title?.color];
    const fill = gradient
        // piugame's 1px outline at its ~23px profile title, kept in proportion at other sizes
        ? { backgroundImage: `linear-gradient(0deg, ${gradient[0]}, ${gradient[1]})`, WebkitTextStroke: '0.045em white' }
        : { backgroundColor: 'rgb(204, 204, 204)' };
    return (
        <Text
            fontFamily="'Oxanium', sans-serif" fontWeight="900" letterSpacing="wide" truncate
            css={{ ...fill, backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            title={title?.text}
            {...props}
        >
            {title?.text}
        </Text>
    );
}

// PUMBILITY tiers in order, 5 levels each, matching piugame's icons pumbility_01..35
// (tier * 5 + level), then ABYSS ABSOLUTE alone as pumbility_36 (00: no tier yet).
// Syncs also record the icon number itself (pumbility.icon), which wins when present.
const PUMBILITY_TIERS = [
    ['BRONZE', 'orange.300'], ['SILVER', 'gray.300'], ['GOLD', 'yellow.300'], ['PLATINUM', 'teal.300'],
    ['DIAMOND', 'blue.300'], ['RED BERYL', 'red.300'], ['ALEXANDRITE', 'purple.300'],
];
const TOP_TIER = ['ABYSS ABSOLUTE', 'orange.200', 36];

function pumbilityTier(pumbility) {
    const tier = pumbility?.tier || '';
    let icon = null;
    let color = 'fg.muted';
    if (tier.startsWith(TOP_TIER[0])) {
        [, color, icon] = TOP_TIER;
    } else {
        const index = PUMBILITY_TIERS.findIndex(([name]) => tier.startsWith(name));
        const level = Number(tier.match(/Lv\.(\d)/)?.[1]);
        if (index >= 0) {
            color = PUMBILITY_TIERS[index][1];
            icon = level ? index * 5 + level : null;
        }
    }
    icon = pumbility?.icon || icon;
    return {
        icon: icon ? pumbilityImg('phx2', icon) : null,
        color,
    };
}

function timeAgo(seconds) {
    const diff = Date.now() / 1000 - seconds;
    if (diff < 60 * 60) return `${Math.max(1, Math.round(diff / 60))}m ago`;
    if (diff < DAY) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / DAY)}d ago`;
}

function formatPumbility(value) {
    return value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function UserCard({ info }) {
    const { pumbility } = info;
    const tier = pumbilityTier(pumbility);
    return (
        <Card.Root
            variant="outline" size="sm" bg="bg.panel"
            transition="transform 0.15s, border-color 0.15s"
            _hover={{ transform: 'translateY(-2px)', borderColor: 'border.emphasized' }}
        >
            <Card.Body px="3">
                <HStack gap="3" align="stretch">
                    {/* piugame avatars are 200x150: shown whole at 4:3, not cropped. Served from
                        piu-assets, falling back to piugame's copy for an avatar we don't have yet */}
                    <Image
                        src={fromPiugameUrl(info.avatar)} alt="" w={{ base: '64px', sm: '80px' }} aspectRatio="4 / 3" flexShrink="0" alignSelf="center"
                        objectFit="contain" borderRadius="md" bg="bg.muted"
                        onError={(e) => { if (e.currentTarget.src !== info.avatar) e.currentTarget.src = info.avatar; }}
                    />
                    {/* spacing set per line so the visible gaps between title, name and PUMBILITY match
                        (~13px between capital letters): the all-caps lines carry less empty space than the last */}
                    <VStack align="start" justify="center" gap="0" minW="0" flex="1">
                        <PlayerTitle title={info.title} w="full" fontSize="14px" lineHeight="1.3" />
                        <Text w="full" mt="5px" fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize="lg" lineHeight="1.2" truncate>
                            {info.player} <Text as="span" color="fg.muted">{info.number}</Text>
                        </Text>
                        <HStack gap="2" w="full" wrap="wrap" rowGap="0" mt="1px">
                            {pumbility?.tier && (
                                <Text fontSize="xs" fontWeight="semibold" color={tier.color} whiteSpace="nowrap">
                                    {pumbility.tier}
                                </Text>
                            )}
                            {pumbility?.value !== undefined && (
                                <Text fontSize="sm" fontVariantNumeric="tabular-nums">{formatPumbility(pumbility.value)}</Text>
                            )}
                        </HStack>
                    </VStack>
                    {/* right edge: tier icon in the top corner, sync time in the bottom corner
                        (the time stays in the corner when there's no tier yet) */}
                    <VStack justify="space-between" align="end" flexShrink="0" gap="1" ms="-1">
                        {tier.icon
                            // the icon art has ~18% transparent padding: these margins inset the art ~15px from the
                            // card's top and right edges alike
                            ? <Image src={tier.icon} alt={pumbility?.tier || ''} boxSize="44px" maxW="none" flexShrink="0" mt="-14px" me="-2.5" />
                            : <Box />}
                        <Text fontSize="xs" color="fg.subtle" whiteSpace="nowrap" lineHeight="1.2">
                            {timeAgo(info.timestamp)}
                        </Text>
                    </VStack>
                </HStack>
            </Card.Body>
        </Card.Root>
    );
}

function UserGrid({ users, loading }) {
    if (loading) {
        return (
            <SimpleGrid templateColumns={CARD_COLUMNS} gap="3">
                {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height="110px" borderRadius="l2" />)}
            </SimpleGrid>
        );
    }
    if (users.length === 0) {
        return (
            <EmptyState.Root size="sm">
                <EmptyState.Content>
                    <EmptyState.Indicator><LuUsers /></EmptyState.Indicator>
                    <EmptyState.Title>No players here yet</EmptyState.Title>
                    <EmptyState.Description>Try another tab, or clear the search.</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState.Root>
        );
    }
    return (
        <SimpleGrid templateColumns={CARD_COLUMNS} gap="3">
            {users.map(({ info }) => <UserCard key={info.player + info.number} info={info} />)}
        </SimpleGrid>
    );
}

// Tab labels: full ("Last 24 hours", ...) wherever they fit, by shrinking the tabs on narrower
// pages: 16px tabs from an 840px-wide screen (see PAGE_WIDTH), 14px with tighter padding in the
// single 480px column (~362px needed), 13px on phones under 420px (~334px, fits a 375px phone).
// Only below 366px (e.g. 360px Androids) do they switch to short labels ("24h", ...).
const NARROW_PAGE = '@media screen and (max-width: 839.98px)';
const PHONE = '@media screen and (max-width: 419.98px)';
const SMALL_PHONE = '@media screen and (max-width: 365.98px)';
const TAB_SIZES = {
    [NARROW_PAGE]: { fontSize: '14px', paddingInline: '8px' },
    [PHONE]: { fontSize: '13px', paddingInline: '6px' },
};

function TabLabel({ long, short }) {
    return (
        <>
            <Box as="span" css={{ [SMALL_PHONE]: { display: 'none' } }}>{long}</Box>
            <Box as="span" display="none" css={{ [SMALL_PHONE]: { display: 'inline' } }}>{short}</Box>
        </>
    );
}

// as on the Phoenix 1 landing page: "Welcome back" for whoever last synced from this browser
function welcomeText() {
    try {
        const latest = JSON.parse(localStorage.getItem('latestSync'));
        if (latest?.player) {
            return `Welcome back, ${latest.player}!`;
        }
    } catch {
        // no storage (private window) or an unreadable entry: plain welcome
    }
    return 'Welcome!';
}

function Phx2HomeContent() {
    const [users, setUsers] = useState(null);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('recent');
    const [tab, setTab] = useState('today');

    // searching looks across every player, not just the current tab
    function onSearch(value) {
        setSearch(value);
        if (value.trim()) {
            setTab('all');
        }
    }

    useEffect(() => {
        getUsers('phx2').then(setUsers).catch(() => { setUsers([]); setError(true); });
    }, []);

    const loading = users === null;
    const now = Date.now() / 1000;
    const groups = useMemo(() => {
        const query = search.trim().toUpperCase();
        let list = (users || []).filter(({ info }) => !query || (info.player + info.number).includes(query));
        if (sortBy === 'pumbility') {
            list = [...list].sort((a, b) => (b.info.pumbility?.value || 0) - (a.info.pumbility?.value || 0));
        }
        return {
            today: list.filter(({ info }) => info.timestamp > now - DAY),
            week: list.filter(({ info }) => info.timestamp > now - 7 * DAY),
            all: list,
        };
    }, [users, search, sortBy, now]);

    return (
        <Box className="phx2-root" minH="100vh" bg="bg" color="fg">
            <Box borderBottomWidth="1px" borderColor="border.muted" bg="bg.subtle">
                <Container css={PAGE_WIDTH} px={{ base: '4', md: '6' }} py="3">
                    <Flex align="center" justify="space-between" gap="4">
                        <HStack gap="2.5" align="baseline">
                            <Heading size={{ base: 'md', md: 'lg' }} fontFamily="'Oxanium', sans-serif" letterSpacing="wide" whiteSpace="nowrap">PIU TRACKER</Heading>
                            <Heading as="span" size={{ base: 'md', md: 'lg' }} color="phx2.fg" whiteSpace="nowrap">PHOENIX 2</Heading>
                        </HStack>
                        <Link asChild fontSize="sm" color="fg.muted" whiteSpace="nowrap">
                            <RouterLink to="/">Phoenix 1 (Legacy)</RouterLink>
                        </Link>
                    </Flex>
                </Container>
            </Box>

            <Container css={PAGE_WIDTH} px={{ base: '4', md: '6' }} py={{ base: '6', md: '10' }}>
                <VStack align="stretch" gap="8">
                    <Box textAlign="center">
                        <Heading size={{ base: 'xl', md: '2xl' }}>{welcomeText()}</Heading>
                        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="medium" mt="5">
                            Search for a USER to get started.
                        </Text>
                        <InputGroup startElement={<LuSearch />} maxW="md" mt="4" mx="auto">
                            <Input
                                size="lg" placeholder="Player name, e.g. TUSA"
                                borderColor="phx2.emphasized" _hover={{ borderColor: 'phx2.border' }}
                                borderRadius="25px"
                                // centered text, with right padding matching the left padding the icon
                                // gets (calc(var(--input-height))), so it centers on the box's real middle
                                textAlign="center" pe="var(--input-height)"
                                value={search} onChange={(e) => onSearch(e.target.value)}
                            />
                        </InputGroup>
                    </Box>

                    {error && (
                        <Text color="fg.error">Couldn't load players right now. Try again later.</Text>
                    )}

                    <Tabs.Root value={tab} onValueChange={(e) => setTab(e.value)} variant="line" colorPalette="phx2">
                        <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                            <Tabs.List>
                                <Tabs.Trigger whiteSpace="nowrap" css={TAB_SIZES} value="today"><TabLabel long="Last 24 hours" short="24h" /> <Badge size="xs" ms="1">{groups.today.length}</Badge></Tabs.Trigger>
                                <Tabs.Trigger whiteSpace="nowrap" css={TAB_SIZES} value="week"><TabLabel long="Last 7 days" short="7 days" /> <Badge size="xs" ms="1">{groups.week.length}</Badge></Tabs.Trigger>
                                <Tabs.Trigger whiteSpace="nowrap" css={TAB_SIZES} value="all"><TabLabel long="All players" short="All" /> <Badge size="xs" ms="1">{groups.all.length}</Badge></Tabs.Trigger>
                            </Tabs.List>
                            <HStack gap="1" fontSize="sm">
                                <Text color="fg.muted" me="1">Sort</Text>
                                {[['recent', 'Recent'], ['pumbility', 'PUMBILITY']].map(([value, label]) => (
                                    <Badge
                                        key={value} as="button" cursor="pointer" size="md"
                                        variant={sortBy === value ? 'solid' : 'outline'} colorPalette="phx2"
                                        onClick={() => setSortBy(value)}
                                    >
                                        {label}
                                    </Badge>
                                ))}
                            </HStack>
                        </Flex>
                        {['today', 'week', 'all'].map((tab) => (
                            <Tabs.Content key={tab} value={tab} pt="5">
                                <UserGrid users={groups[tab]} loading={loading} />
                            </Tabs.Content>
                        ))}
                    </Tabs.Root>
                </VStack>
            </Container>
        </Box>
    );
}

function Phx2Home() {
    return (
        <ChakraProvider value={system}>
            <Theme appearance="dark" colorPalette="phx2">
                <Phx2HomeContent />
            </Theme>
        </ChakraProvider>
    );
}

export default Phx2Home;

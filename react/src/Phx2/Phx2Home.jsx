import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Badge, Box, Button, Card, Container, EmptyState, Flex, Heading, HStack, Input, InputGroup,
    Image, SimpleGrid, Skeleton, Tabs, Text, VStack,
} from '@chakra-ui/react';
import { LuArrowRight, LuSearch, LuUsers } from 'react-icons/lu';

import getUsers from '../API/users';
import { fromPiugameUrl } from '../Helpers/assets';
import { userPath } from '../Helpers/paths';
import {
    DAY, PAGE_WIDTH, SMALL_PHONE, TAB_SIZES, Phx2Layout, PlayerTitle, formatPumbility, pumbilityTier, timeAgo,
} from './shared';

// PROTOTYPE: Phoenix 2 home page at /phx2 (Chakra UI, dark; see shared.jsx).

// Cards are >= 380px wide, as many per row as fit, and the page widens in steps so they never
// stretch much past that: 1 per row in a 480px page, 2 in an 880px page from an 840px-wide screen
// (where two first fit), 3 in a 1248px page from 1280px. Every card stays ~390-430px, leaving the
// title ~220px next to the avatar and tier icon: room for ~94% of Phoenix 2 titles at 14px; longer
// ones are truncated, with the full title on hover. Phones get the single column at full width.
const CARD_COLUMNS = 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))';


function UserCard({ info }) {
    const { pumbility } = info;
    const tier = pumbilityTier(pumbility);
    return (
        <Card.Root
            asChild variant="outline" size="sm" bg="bg.panel"
            transition="transform 0.15s, border-color 0.15s"
            _hover={{ transform: 'translateY(-2px)', borderColor: 'border.emphasized' }}
        >
            <RouterLink to={userPath('phx2', info.player, info.number.replace('#', ''))}>
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
            </RouterLink>
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

function TabLabel({ long, short }) {
    return (
        <>
            <Box as="span" css={{ [SMALL_PHONE]: { display: 'none' } }}>{long}</Box>
            <Box as="span" display="none" css={{ [SMALL_PHONE]: { display: 'inline' } }}>{short}</Box>
        </>
    );
}

// whoever last synced from this browser (Phoenix 1 or 2): { player, number: "#7085", ... } or null
function latestSync() {
    try {
        const latest = JSON.parse(localStorage.getItem('latestSync'));
        return latest?.player ? latest : null;
    } catch {
        // no storage (private window) or an unreadable entry
        return null;
    }
}

// "TUSA #7085", "tusa#7085": a player name and number (always 4 digits), as piugame shows them
function parsePlayer(text) {
    const match = text.trim().match(/^(\S+)\s*#\s*(\d{4})$/);
    return match ? { name: match[1].toUpperCase(), number: match[2] } : null;
}

function Phx2Home() {
    const navigate = useNavigate();
    // as on the Phoenix 1 landing page: "Welcome back", and their card when they have a Phoenix 2 page
    const latest = useMemo(latestSync, []);
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

    // a full NAME #NUMBER search can go straight to that page, synced yet or not: a player new here
    // gets the sync form there to set it up
    const typed = parsePlayer(search);
    const known = typed && (users || []).some(({ info }) => info.player === typed.name && info.number === `#${typed.number}`);
    function onSearchKey(event) {
        if (event.key === 'Enter' && typed) {
            navigate(userPath('phx2', typed.name, typed.number));
        }
    }

    const loading = users === null;
    const mine = latest && (users || []).find(({ info }) => info.player === latest.player && info.number === latest.number);
    const now = Date.now() / 1000;
    const groups = useMemo(() => {
        // "TUSA #7085" finds TUSA#7085 too
        const query = search.replace(/\s+/g, '').toUpperCase();
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
        <Phx2Layout>

            <Container css={PAGE_WIDTH} px={{ base: '4', md: '6' }} py={{ base: '6', md: '10' }}>
                <VStack align="stretch" gap="8">
                    <Box textAlign="center">
                        <Heading size={{ base: 'xl', md: '2xl' }}>{latest ? `Welcome back, ${latest.player}!` : 'Welcome!'}</Heading>
                        {mine && (
                            <Box maxW="md" mx="auto" mt="5" textAlign="start">
                                <UserCard info={mine.info} />
                            </Box>
                        )}
                        <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="medium" mt="5">
                            Search for a USER to get started.
                        </Text>
                        <InputGroup startElement={<LuSearch />} maxW="md" mt="4" mx="auto">
                            <Input
                                size="lg" placeholder="TUSA #7085"
                                borderColor="phx2.emphasized" _hover={{ borderColor: 'phx2.border' }}
                                borderRadius="25px"
                                // centered text, with right padding matching the left padding the icon
                                // gets (calc(var(--input-height))), so it centers on the box's real middle
                                textAlign="center" pe="var(--input-height)"
                                value={search} onChange={(e) => onSearch(e.target.value)} onKeyDown={onSearchKey}
                            />
                        </InputGroup>
                        {typed && !known && !loading ? (
                            // its own centered line under the search box
                            <Box mt="3">
                                <Button asChild variant="outline" colorPalette="phx2" size="sm" borderRadius="full">
                                    <RouterLink to={userPath('phx2', typed.name, typed.number)}>
                                        Set up {typed.name} #{typed.number}'s page <LuArrowRight />
                                    </RouterLink>
                                </Button>
                            </Box>
                        ) : !mine && (
                            // not for a returning player, whose card is right above
                            <Text fontSize="sm" color="fg.muted" mt="3">
                                New here? Search your name and number above to set up your page.
                            </Text>
                        )}
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
        </Phx2Layout>
    );
}

export default Phx2Home;

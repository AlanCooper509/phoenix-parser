import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    ChakraProvider, Theme, Badge, Box, Container, createToaster, Flex, Heading, HStack, Image, Link, Progress, ProgressCircle,
    Stack, Text, Toast, Toaster,
} from '@chakra-ui/react';

import { pumbilityImg, songImg } from '../Helpers/assets';
import system from './theme';
import './Phx2.css';

// Phoenix 2's styles stay in the page once loaded: Phoenix (1) pages check this and reload (App.jsx)
window.phx2StylesLoaded = true;

// piugame.com's text font, loaded only once a Phoenix 2 page does (Oxanium loads in index.html)
const PRETENDARD_CSS = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css';
if (!document.querySelector(`link[href="${PRETENDARD_CSS}"]`)) {
    document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href: PRETENDARD_CSS }));
}

// Pieces shared by the Phoenix 2 pages (Chakra UI, dark). Chakra only wraps these routes,
// so the Bootstrap pages are untouched.

export const DAY = 24 * 60 * 60;

// The home page widens in steps (see its CARD_COLUMNS for why): a 480px column, an 880px page
// from an 840px-wide screen, a 1248px page from 1280px.
export const PAGE_WIDTH = {
    maxWidth: '480px',
    '@media screen and (min-width: 840px)': { maxWidth: '880px' },
    '@media screen and (min-width: 1280px)': { maxWidth: '1248px' },
};

// Pages with charts and tables (a player's page) just use the room there is, up to the same 1248px.
export const WIDE_PAGE_WIDTH = { maxWidth: '1248px' };

// Tab labels: full ("Last 24 hours", ...) wherever they fit, by shrinking the tabs on narrower
// pages: 16px tabs from an 840px-wide screen (see PAGE_WIDTH), 14px with tighter padding in the
// single 480px column (~362px needed), 13px on phones under 420px (~334px, fits a 375px phone).
// Only below 366px (e.g. 360px Androids) do they switch to short labels ("24h", ...).
export const NARROW_PAGE = '@media screen and (max-width: 839.98px)';
export const PHONE = '@media screen and (max-width: 419.98px)';
export const SMALL_PHONE = '@media screen and (max-width: 365.98px)';

// `long` text, or `short` on phones, where there's no room for the long one (header, tabs)
export function PhoneShort({ long, short }) {
    return (
        <>
            <Box as="span" css={{ [PHONE]: { display: 'none' } }}>{long}</Box>
            <Box as="span" display="none" css={{ [PHONE]: { display: 'inline' } }}>{short}</Box>
        </>
    );
}
export const TAB_SIZES = {
    [NARROW_PAGE]: { fontSize: '14px', paddingInline: '8px' },
    [PHONE]: { fontSize: '13px', paddingInline: '6px' },
};

// Chakra provider, dark theme and the site header around a Phoenix 2 page; the header is as wide
// as the page (`width`) so it lines up with the content
// Short notices in the corner (e.g. a finished sync): toaster.create({ type: 'success', title, description })
export const toaster = createToaster({ placement: 'bottom-end', pauseOnPageIdle: true });

function Toasts() {
    return (
        // not in a portal, so the toasts stay within the dark Phoenix 2 theme
        <Toaster toaster={toaster} insetInline={{ mdDown: '4' }}>
            {(toast) => (
                <Toast.Root width={{ md: 'sm' }}>
                    <Toast.Indicator />
                    <Stack gap="1" flex="1" maxW="100%">
                        {toast.title && <Toast.Title>{toast.title}</Toast.Title>}
                        {toast.description && <Toast.Description>{toast.description}</Toast.Description>}
                    </Stack>
                    <Toast.CloseTrigger />
                </Toast.Root>
            )}
        </Toaster>
    );
}

// `legacyLink`: the header's link to the Phoenix 1 (legacy) site, shown on the home page only
export function Phx2Layout({ children, width = PAGE_WIDTH, legacyLink = false }) {
    return (
        <ChakraProvider value={system}>
            <Theme appearance="dark" colorPalette="phx2">
                <Box className="phx2-root" minH="100vh" bg="bg" color="fg">
                    <Box borderBottomWidth="1px" borderColor="border.muted" bg="bg.subtle">
                        <Container css={width} px={{ base: '4', md: '6' }} py="3">
                            <Flex align="center" justify="space-between" gap="4">
                                <HStack gap="2.5" align="baseline">
                                    <Heading size={{ base: 'md', md: 'lg' }} fontFamily="'Oxanium', sans-serif" letterSpacing="wide" whiteSpace="nowrap">
                                        <RouterLink to="/">PIU TRACKER</RouterLink>
                                    </Heading>
                                    <Heading as="span" size={{ base: 'md', md: 'lg' }} color="phx2.fg" whiteSpace="nowrap">
                                        <PhoneShort long="PHOENIX 2" short="PHX2" />
                                    </Heading>
                                </HStack>
                                {/* a full page load, not an in-app link: see LegacyPage in App.jsx */}
                                {legacyLink && (
                                    <Link href="/phx1" fontSize="sm" color="fg.muted" whiteSpace="nowrap">
                                        <PhoneShort long="Phoenix 1 (Legacy)" short="PHX1" />
                                    </Link>
                                )}
                            </Flex>
                        </Container>
                    </Box>

                    {children}
                    <Toasts />
                </Box>
            </Theme>
        </ChakraProvider>
    );
}

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

// `outline` is the white stroke's width: piugame's 1px at its ~23px profile title by default, kept in
// proportion at other sizes. `lift` (0 to 1) moves the gradient's dark end toward its light one,
// for titles drawn without the outline that otherwise sets them off the dark background.
export function PlayerTitle({ title, outline = '0.045em', lift = 0, ...props }) {
    const gradient = TITLE_GRADIENTS[title?.color];
    const dark = gradient && (lift ? `color-mix(in srgb, ${gradient[1]}, ${gradient[0]} ${lift * 100}%)` : gradient[1]);
    const fill = gradient
        ? { backgroundImage: `linear-gradient(0deg, ${gradient[0]}, ${dark})`, WebkitTextStroke: `${outline} white` }
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
// BRONZE is taken from its icon (copper around #ab5719), lightened to read as text on the dark
// background. RED BERYL keeps its gem's red hue (#bf0303) but clearly lighter, so it doesn't blur
// with the singles red (red.400) it often sits beside.
const PUMBILITY_TIERS = [
    ['BRONZE', '#d4843e'], ['SILVER', 'gray.300'], ['GOLD', 'yellow.300'], ['PLATINUM', 'teal.300'],
    ['DIAMOND', 'blue.500'], ['RED BERYL', 'red.400'], ['ALEXANDRITE', 'purple.500'],
];
const TOP_TIER = ['ABYSS ABSOLUTE', 'orange.200', 36];

export function pumbilityTier(pumbility) {
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

// A PUMBILITY tier's name ("RED BERYL Lv.5") in the gradient piugame gives its [P.B] title (col1
// BRONZE ... col7 ALEXANDRITE), drawn like the singles and doubles titles: no outline, dark end
// lightened. ABYSS ABSOLUTE has no known title colors and keeps its plain color.
export function TierName({ tier, ...props }) {
    const index = PUMBILITY_TIERS.findIndex(([name]) => tier?.startsWith(name));
    if (index < 0) {
        return <Text fontWeight="bold" color={pumbilityTier({ tier }).color} {...props}>{tier}</Text>;
    }
    return <TitleText title={{ text: tier, color: `col${index + 1}` }} {...props} />;
}

// piugame's title gradient as plain text: Pretendard at 900 as in its title list, without the white
// outline, the dark end lightened so it reads on the dark background
export function TitleText({ title, ...props }) {
    return <PlayerTitle title={title} fontFamily="inherit" letterSpacing="normal" outline="0" lift={0.45} {...props} />;
}

export function timeAgo(seconds) {
    const diff = Date.now() / 1000 - seconds;
    if (diff < 60 * 60) return `${Math.max(1, Math.round(diff / 60))}m ago`;
    if (diff < DAY) return `${Math.round(diff / 3600)}h ago`;
    return `${Math.round(diff / DAY)}d ago`;
}

export function formatPumbility(value) {
    return value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}


// A player's place in piugame's PUMBILITY ranking (overall, or `what`: "singles", "doubles"), as
// "(#95)": a number within the top 1,000 it lists, otherwise whatever the ranking page showed instead.
export function RankTag({ rank, what, ...props }) {
    if (rank === null || rank === undefined || rank === '') {
        return null;
    }
    const shown = typeof rank === 'number' ? `#${rank.toLocaleString()}` : rank;
    return (
        <Text
            as="span" color="fg.muted" fontWeight="normal" fontVariantNumeric="tabular-nums" whiteSpace="nowrap" flexShrink="0"
            title={`${shown} in PUMBILITY ranking${what ? ` (${what})` : ''}`} {...props}
        >
            ({shown})
        </Text>
    );
}

// Shown beside a progress track whose best fifty isn't full yet: a small ring filled as far as the
// charts counting so far (`what` names them, e.g. "singles"), the count, and the rest in a tooltip.
// `color` matches the track's own label.
export function UnfilledFifty({ counted, what = 'charts', color = 'fg.muted' }) {
    if (counted >= 50) {
        return null;
    }
    return (
        <HStack
            as="span" gap="1" fontSize="xs" fontWeight="semibold" color={color} fontVariantNumeric="tabular-nums"
            title={`Only ${counted} of your best 50 ${what} count so far: every new clear adds to it until all 50 are filled.`}
        >
            <ProgressCircle.Root value={(100 * counted) / 50}>
                {/* Chakra sets the ring's size on the circle itself */}
                <ProgressCircle.Circle css={{ '--size': '14px', '--thickness': '2.5px' }}>
                    <ProgressCircle.Track stroke="whiteAlpha.300" />
                    <ProgressCircle.Range stroke={color} />
                </ProgressCircle.Circle>
            </ProgressCircle.Root>
            {counted}/50
        </HStack>
    );
}

// fills like chart.js's own animation (1s, easeOutQuart)
const EASE_OUT_QUART = '1s cubic-bezier(0.25, 1, 0.5, 1)';
const FILL_TRANSITION = `width ${EASE_OUT_QUART}`;
const MARKER_SIZE = 44;
const BAR_HEIGHTS = { sm: 8, md: 12 };

// An experience bar from the milestone reached to the next one (pumbility.js's progressAlong),
// filling from empty as charts draw themselves in, with the points, percentage and points left
// under it. With a `label` (in `labelColor`), the label and the milestone reached head it. A
// milestone with a piugame `title`, or a PUMBILITY `tier`, is drawn in piugame's title gradient
// (TitleText, TierName); otherwise `colorOf` colors its name (the bar's own color by
// default). A `marker`
// image (the PUMBILITY tier icon) rides the end of the fill, `markerSize` px across; `markerRoom`
// leaves that room around a bar even without one, so bars side by side line up. `size` is the
// bar's thickness (sm or md). `rank` and `badge` follow the milestone reached.
export function ExpBar({
    label, labelColor = 'fg.muted', value, progress, color, colorOf = () => color,
    marker, markerSize = MARKER_SIZE, markerRoom = Boolean(marker), size = 'sm', badge, rank, ...props
}) {
    const { current, next, percent, remaining } = progress;
    const name = (milestone, nameProps) => {
        if (milestone.title) {
            return <TitleText title={milestone.title} {...nameProps} />;
        }
        if (milestone.tier) {
            return <TierName tier={milestone.name} {...nameProps} />;
        }
        return <Text color={colorOf(milestone.name)} fontWeight="semibold" {...nameProps}>{milestone.name}</Text>;
    };
    const [filled, setFilled] = useState(0);
    // two frames, so the empty bar is painted before it fills
    useEffect(() => {
        let frame = requestAnimationFrame(() => {
            frame = requestAnimationFrame(() => setFilled(percent));
        });
        return () => cancelAnimationFrame(frame);
    }, [percent]);
    return (
        <Box {...props}>
            {/* laid out like the PUMBILITY headline: label, milestone reached and badge, then the value */}
            {label && (
                <HStack justify="space-between" align="center" gap="3" mb="1">
                    <HStack gap="2" minW="0">
                        <Text fontSize="sm" fontWeight="semibold" color={labelColor} flexShrink="0">{label}</Text>
                        {current
                            ? name(current, { fontSize: 'sm', truncate: true })
                            : <Text fontSize="sm" color="fg.muted" flexShrink="0">None yet</Text>}
                        {rank}
                        {badge}
                    </HStack>
                    <Text
                        fontFamily="'Oxanium', sans-serif" fontWeight="800" fontSize="xl" lineHeight="1"
                        fontVariantNumeric="tabular-nums" flexShrink="0"
                    >
                        {formatPumbility(value)}
                    </Text>
                </HStack>
            )}
            {/* room above and below the bar for the marker, which stays inside the bar's ends */}
            <Box position="relative" my={markerRoom ? `${(markerSize - BAR_HEIGHTS[size]) / 2}px` : undefined}>
                <Progress.Root value={filled} size={size} aria-label={next ? `${label || 'Progress'} to ${next.name}` : label}>
                    <Progress.Track bg="bg.emphasized" borderRadius="full">
                        <Progress.Range bg={color} borderRadius="full" transition={FILL_TRANSITION} />
                    </Progress.Track>
                </Progress.Root>
                {marker && (
                    <Image
                        src={marker} alt="" position="absolute" top="50%" boxSize={`${markerSize}px`} pointerEvents="none"
                        left={`clamp(${markerSize / 2}px, ${filled}%, calc(100% - ${markerSize / 2}px))`}
                        transform="translate(-50%, -50%)" transition={`left ${EASE_OUT_QUART}`}
                        filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.6))"
                    />
                )}
            </Box>
            <HStack justify="space-between" columnGap="3" rowGap="0" wrap="wrap" mt="1" fontSize="xs" color="fg.muted" fontVariantNumeric="tabular-nums">
                {next ? (
                    <>
                        <Text flexShrink="0">{formatPumbility(value)} / {next.value.toLocaleString()} ({Math.floor(percent)}%)</Text>
                        {/* wraps under the points on narrow screens, still right-aligned */}
                        <Text ms="auto">
                            {formatPumbility(remaining)} to{' '}
                            {name(next, { as: 'span', truncate: false })}
                        </Text>
                    </>
                ) : <Text>{formatPumbility(value)}: top reached</Text>}
            </HStack>
        </Box>
    );
}

// A song's jacket, whole: piugame's are all 700x393 (about 16:9), so they're shown at that shape
// rather than cropped to a square. `w` sets the width.
export function Jacket({ jacket, w = '64px', ...props }) {
    return (
        <Image
            src={songImg('phx2', jacket)} alt="" w={w} aspectRatio="700 / 393" objectFit="contain" flexShrink="0"
            borderRadius="sm" bg="bg.muted" loading="lazy" {...props}
        />
    );
}

// "S22" / "D24" / "C2", colored like piugame's step balls (red singles, green doubles, yellow co-op).
// Co-op charts go by player count (level "n2", as synced) rather than a level: C2 is co-op x2.
const CHART_COLORS = { s: 'red', d: 'green', c: 'yellow' };

export function ChartBadge({ type, level, ...props }) {
    const players = String(level).match(/^n(\d+)$/)?.[1];
    return (
        <Badge colorPalette={CHART_COLORS[type] || 'gray'} variant="subtle" fontVariantNumeric="tabular-nums" whiteSpace="nowrap" {...props}>
            {players ? `C${players}` : `${type.toUpperCase()}${String(level).replace(/^0/, '')}`}
        </Badge>
    );
}

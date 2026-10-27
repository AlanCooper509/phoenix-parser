import { useState } from 'react';
import { Box, Button, CloseButton, Code, Collapsible, Dialog, Grid, HStack, Input, Kbd, Link, List, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuCheckCircle2, LuExternalLink, LuRefreshCw } from 'react-icons/lu';

import postSyncData from '../API/syncdata';
import { toaster } from './shared';

// Syncing a player's Phoenix 2 data from piugame.com with their session ID (SID), as the Phoenix (1)
// page's "Update Game Data" does: POST /api/phx2/sync, which returns the synced user so the page
// updates in place. The server allows one sync per player every 8 hours.

const SYNC_SITE = 'https://piugame.com';
const SYNC_EVERY = 8 * 60 * 60;
const GET_COOKIE_SHORTCUT = 'https://www.icloud.com/shortcuts/4503cc77f384489abecc27a9f2b3d981';

// the SID from what was pasted: the bare value, or a whole document.cookie ("PHPSESSID=...; sid=...")
export function parseSid(input) {
    const text = input.trim();
    const fromCookie = text.match(/(?:^|;\s*)sid=([^;\s]+)/);
    const sid = fromCookie ? fromCookie[1] : text;
    return /^[A-Za-z0-9,-]{1,128}$/.test(sid) ? sid : null;
}

function ExternalLink({ href, children }) {
    return (
        <Link href={href} target="_blank" rel="noreferrer" color="phx2.fg">
            {children} <LuExternalLink />
        </Link>
    );
}

// how to find the SID on desktop, iPhone/iPad and Android
function SidHelp({ open, onClose, name, number }) {
    return (
        // inline rather than in a portal, so it stays within the dark Phoenix 2 theme
        <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size={{ base: 'full', md: 'lg' }} scrollBehavior="inside">
            <Dialog.Backdrop />
            <Dialog.Positioner>
                <Dialog.Content>
                    <Dialog.Header>
                        <Dialog.Title>Syncing your Phoenix 2 data</Dialog.Title>
                    </Dialog.Header>
                    <Dialog.Body>
                        <List.Root as="ol" gap="5" ps="5">
                            <List.Item>
                                Open your own page on this site{name && <Text as="span" color="fg.muted"> (this is {name} #{number})</Text>}.
                            </List.Item>
                            <List.Item>
                                Log in to <ExternalLink href={SYNC_SITE}>piugame.com</ExternalLink>.
                            </List.Item>
                            <List.Item>
                                <Text mb="2">Find your SID, still on the piugame.com tab:</Text>
                                <VStack align="stretch" gap="3">
                                    <Box>
                                        <Text fontWeight="semibold">Desktop</Text>
                                        <Text color="fg.muted">
                                            Open the DevTools Console (<Kbd>Ctrl</Kbd> <Kbd>Shift</Kbd> <Kbd>J</Kbd>, or <Kbd>⌥</Kbd> <Kbd>⌘</Kbd> <Kbd>J</Kbd> on
                                            a Mac), type <Code>document.cookie</Code> and press <Kbd>Enter</Kbd>.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="semibold">iPhone and iPad (Safari)</Text>
                                        <Text color="fg.muted">
                                            Add the <ExternalLink href={GET_COOKIE_SHORTCUT}>Get Cookie</ExternalLink> shortcut once, and allow it to run
                                            scripts (Settings, Shortcuts, Advanced, Allow Running Scripts). Then tap Share and choose Get Cookie: it
                                            copies the SID for you.
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontWeight="semibold">Android (Chrome, Firefox)</Text>
                                        <Text color="fg.muted">
                                            Bookmark any page once and change the bookmark's URL to <Code>javascript:document.cookie</Code>. Then type
                                            the bookmark's name in the address bar and tap it.
                                        </Text>
                                    </Box>
                                </VStack>
                            </List.Item>
                            <List.Item>
                                Paste the value after <Code>sid=</Code> (or the whole cookie text) into the SID box and press Sync.
                            </List.Item>
                        </List.Root>
                        <List.Root mt="6" gap="1" ps="5" fontSize="sm" color="fg.muted">
                            <List.Item>Your SID is only used for this sync, and isn't stored.</List.Item>
                            <List.Item>It reads your player card, best scores, PUMBILITY, titles and recent plays. The page it updates is public.</List.Item>
                            <List.Item>You can only sync your own page, once every 8 hours.</List.Item>
                        </List.Root>
                    </Dialog.Body>
                    <Dialog.CloseTrigger asChild>
                        <CloseButton size="sm" />
                    </Dialog.CloseTrigger>
                </Dialog.Content>
            </Dialog.Positioner>
        </Dialog.Root>
    );
}

// The sync form: an SID box and a Sync button, with the result underneath. onSynced(user) gets the
// synced user (the same shape as GET /user).
export function SyncForm({ name, number, onSynced }) {
    const [sid, setSid] = useState('');
    const [state, setState] = useState({ status: 'idle', message: null });
    const [help, setHelp] = useState(false);
    const loading = state.status === 'loading';

    async function submit(event) {
        event.preventDefault();
        if (loading) {
            return;
        }
        const parsed = parseSid(sid);
        if (!parsed) {
            setState({ status: 'error', message: "That doesn't look like an SID. Paste the value after sid= from piugame.com." });
            return;
        }
        setState({ status: 'loading', message: null });
        try {
            const result = await postSyncData('phx2', name.toUpperCase(), number, parsed);
            try {
                localStorage.setItem('latestSync', JSON.stringify({ ...result.info, game: 'phx2' }));
            } catch {
                // no storage (private window): only the home page's "Welcome back" misses out
            }
            setSid('');
            const message = `${result.scores.toLocaleString()} best scores and ${result.titles.toLocaleString()} titles synced.`;
            setState({ status: 'success', message });
            toaster.create({ type: 'success', title: `${result.info.player} ${result.info.number} is up to date`, description: message, duration: 6000 });
            onSynced?.(result.user);
        } catch (error) {
            setState({ status: 'error', message: error.message });
        }
    }

    return (
        <Box as="form" onSubmit={submit} w="full">
            <HStack gap="2">
                <Input
                    value={sid} onChange={(e) => setSid(e.target.value)} placeholder="Session ID (SID)" aria-label="Session ID (SID)"
                    size="sm" borderColor="phx2.emphasized" autoComplete="off" spellCheck={false} disabled={loading}
                />
                <Button type="submit" size="sm" colorPalette="phx2" loading={loading} loadingText="Syncing" flexShrink="0">
                    Sync
                </Button>
            </HStack>
            <HStack justify="space-between" align="start" gap="3" mt="1.5" fontSize="sm">
                <Link as="button" type="button" color="phx2.fg" onClick={() => setHelp(true)} flexShrink="0">
                    How do I find my SID?
                </Link>
                {loading && <Text color="fg.muted" textAlign="end">This can take a minute.</Text>}
            </HStack>
            {state.message && (
                <Text mt="2" fontSize="sm" color={state.status === 'success' ? 'phx2.fg' : 'red.300'}>{state.message}</Text>
            )}
            <SidHelp open={help} onClose={() => setHelp(false)} name={name.toUpperCase()} number={number} />
        </Box>
    );
}

// A player's page header: their profile (`children`) with the sync control beside it, top right.
// Once 8 hours have passed since the last sync (shown in the profile), "Update game data" opens the
// sync form: right under it beside the profile, or on phones (where it's just an icon, to fit
// beside the profile) across the full width below.
const HEADER_AREAS = { base: '"profile sync" "form form"', md: '"profile sync" "profile form"' };

function SyncPanel({ info, name, number, onSynced, children }) {
    const [open, setOpen] = useState(false);
    // after a sync from this page, "Sync successful!" stands in for the wait until it's reloaded
    const [justSynced, setJustSynced] = useState(false);
    const waiting = SYNC_EVERY - (Date.now() / 1000 - info.timestamp);
    return (
        <Collapsible.Root open={open} onOpenChange={(e) => setOpen(e.open)} disabled={waiting > 0}>
            <Grid templateAreas={HEADER_AREAS} templateColumns="minmax(0, 1fr) auto" templateRows="auto 1fr" columnGap="3">
                <Box gridArea="profile" minW="0" display="flex">{children}</Box>
                <Box gridArea="sync" justifySelf="end">
                    {justSynced ? (
                        <HStack gap="1.5" fontSize="sm" color="phx2.fg" fontWeight="semibold" whiteSpace="nowrap">
                            <LuCheckCircle2 />
                            <Box as="span" display={{ base: 'none', sm: 'inline' }}>Sync successful!</Box>
                        </HStack>
                    ) : waiting > 0 ? (
                        <Text fontSize="xs" color="fg.subtle" whiteSpace="nowrap" flexShrink="0" title="Syncing is available once every 8 hours">
                            <Box as="span" display={{ base: 'none', sm: 'inline' }}>Can sync again in </Box>
                            <Box as="span" display={{ base: 'inline', sm: 'none' }}>Sync in </Box>
                            {Math.ceil(waiting / 3600)}h
                        </Text>
                    ) : (
                        <Collapsible.Trigger asChild>
                            <Button size="xs" variant="ghost" colorPalette="phx2" color="phx2.fg" flexShrink="0" aria-label="Update game data">
                                <LuRefreshCw />
                                <Box as="span" display={{ base: 'none', sm: 'inline' }}>Update game data</Box>
                                <Box
                                    as={LuChevronDown} display={{ base: 'none', sm: 'inline' }}
                                    transform={open ? 'rotate(180deg)' : undefined} transition="transform 0.2s"
                                />
                            </Button>
                        </Collapsible.Trigger>
                    )}
                </Box>
                <Collapsible.Content gridArea="form">
                    <Box pt={{ base: '4', md: '2' }} w={{ md: '360px' }}>
                        <SyncForm
                            name={name} number={number}
                            onSynced={(user) => { setOpen(false); setJustSynced(true); onSynced(user); }}
                        />
                    </Box>
                </Collapsible.Content>
            </Grid>
        </Collapsible.Root>
    );
}

export default SyncPanel;

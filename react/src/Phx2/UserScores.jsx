import { useEffect, useRef, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';

import { isCleared } from './pumbility';
import { isOfType, ViewLink } from './scoreGrid';
import UserBestScores from './UserBestScores';
import UserRecent from './UserRecent';

// The bottom of Overview: its two score tables, one at a time, the open one in the URL (?view=recent, or
// nothing for Best Scores) so links work. There's no tab row: the open table's heading sits beside the
// other's name and count (smaller, muted, in the same order), which switches to it. Each table stays
// mounted once opened, only hidden, so it keeps its sort, filters, page and columns while the other's open.
// `filter` is Overview's All / Singles / Doubles / Co-op, which picks these tables' charts too.
// [value, name beside the open view's heading]
export const SCORE_VIEWS = [['best', 'Best'], ['recent', 'Recents']];

// how long the area keeps the old table's height while a table opened for the first time draws its rows
const HOLD_MS = 500;

function UserScores({ user, summary, filter }) {
    // Overview's All is singles and doubles for its progress and chart, but every play here
    const type = filter === 'both' ? 'all' : filter;
    const [params, setParams] = useSearchParams();
    const view = params.get('view') === 'recent' ? 'recent' : 'best';
    // a grid measures its width as it mounts, so each mounts when first shown rather than hidden
    const opened = useRef(new Set());
    opened.current.add(view);

    // first opening a table mounts a new grid, which has no height until its rows draw: the area keeps the
    // old table's height meanwhile, so the page doesn't shrink and scroll back to the top
    const area = useRef(null);
    const [hold, setHold] = useState(null);
    useEffect(() => {
        if (hold === null) {
            return undefined;
        }
        const timer = setTimeout(() => setHold(null), HOLD_MS);
        return () => clearTimeout(timer);
    }, [hold]);
    const open = (value) => {
        setHold(area.current?.offsetHeight ?? null);
        setParams((current) => {
            const updated = new URLSearchParams(current);
            if (value === 'best') {
                updated.delete('view');
            } else {
                updated.set('view', value);
            }
            return updated;
        }, { replace: true });
    };

    // what each table's rows come to (reported by the table once mounted; until then, what it starts with:
    // clears only for Best Scores, every play for Recently Played)
    const recents = user.recents || [];
    const [reported, setReported] = useState({});
    const counts = {
        best: reported.best ?? user.scores.filter((score) => isCleared(score) && isOfType(score, type)).length,
        recent: reported.recent ?? recents.filter((play) => isOfType(play, type)).length,
    };
    const report = (value) => (count) => setReported((all) => (all[value] === count ? all : { ...all, [value]: count }));

    // the other view's name and count, before or after the open one's heading
    const navOf = (shown) => {
        const at = SCORE_VIEWS.findIndex(([value]) => value === shown);
        const links = (views) => views.map(([value, label]) => (
            <ViewLink key={value} label={`${label} (${counts[value].toLocaleString()})`} onClick={() => open(value)} />
        ));
        return { before: links(SCORE_VIEWS.slice(0, at)), after: links(SCORE_VIEWS.slice(at + 1)) };
    };
    return (
        <Box ref={area} minH={hold ? `${hold}px` : undefined}>
            {opened.current.has('best') && (
                <Box display={view === 'best' ? 'block' : 'none'}>
                    <UserBestScores scores={user.scores} summary={summary} nav={navOf('best')} type={type} onCountChange={report('best')} />
                </Box>
            )}
            {opened.current.has('recent') && (
                <Box display={view === 'recent' ? 'block' : 'none'}>
                    <UserRecent recents={recents} nav={navOf('recent')} type={type} onCountChange={report('recent')} />
                </Box>
            )}
        </Box>
    );
}

export default UserScores;

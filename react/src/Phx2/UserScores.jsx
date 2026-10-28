import { useNavigate } from 'react-router-dom';

import { userPath } from '../Helpers/paths';
import { ViewLink } from './scoreGrid';
import UserBestScores from './UserBestScores';
import UserRecent from './UserRecent';
import UserTopFifty from './UserTopFifty';

// Scores: the three score tables, one at a time, each with its own URL (/scores, /scores/pumbility,
// /scores/recent) so back/forward and links work as with the main tabs. There's no tab row: the open
// table's heading sits among the other two views' names (smaller, muted, in the same order), which
// switch to them.
// [value, name beside the open view's heading]
export const SCORE_VIEWS = [['best', 'Best'], ['pumbility', 'PUMBILITY'], ['recent', 'Recents']];

function UserScores({ name, number, view = 'best', user, summary }) {
    const navigate = useNavigate();
    const open = (value) => navigate(userPath('phx2', name, number, value === 'best' ? 'scores' : `scores/${value}`));
    // the other views' names, before and after the open one's heading
    const at = SCORE_VIEWS.findIndex(([value]) => value === view);
    const links = (views) => views.map(([value, label]) => <ViewLink key={value} label={label} onClick={() => open(value)} />);
    const nav = { before: links(SCORE_VIEWS.slice(0, at)), after: links(SCORE_VIEWS.slice(at + 1)) };
    return (
        <>
            {/* only the open view is rendered, as with the main tabs */}
            {view === 'best' && <UserBestScores scores={user.scores} summary={summary} nav={nav} />}
            {view === 'pumbility' && <UserTopFifty scores={user.scores} summary={summary} nav={nav} />}
            {view === 'recent' && <UserRecent recents={user.recents || []} nav={nav} />}
        </>
    );
}

export default UserScores;

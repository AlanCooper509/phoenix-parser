import { Tabs } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

import { userPath } from '../Helpers/paths';
import UserBestScores from './UserBestScores';
import UserRecent from './UserRecent';
import UserTopFifty from './UserTopFifty';

// Scores: the three score tables, one at a time, each with its own URL (/scores, /scores/pumbility,
// /scores/recent) so back/forward and links work as with the main tabs.
export const SCORE_VIEWS = [['best', 'Best Scores'], ['pumbility', 'PUMBILITY'], ['recent', 'Recently Played']];

function UserScores({ name, number, view = 'best', user, summary }) {
    const navigate = useNavigate();
    return (
        <Tabs.Root
            value={view} variant="subtle" size="sm" colorPalette="phx2" lazyMount
            onValueChange={(e) => navigate(userPath('phx2', name, number, e.value === 'best' ? 'scores' : `scores/${e.value}`))}
        >
            <Tabs.List mb="6">
                {SCORE_VIEWS.map(([value, label]) => <Tabs.Trigger key={value} value={value}>{label}</Tabs.Trigger>)}
            </Tabs.List>
            {/* only the open view is rendered, as with the main tabs */}
            <Tabs.Content value="best" p="0">{view === 'best' && <UserBestScores scores={user.scores} summary={summary} />}</Tabs.Content>
            <Tabs.Content value="pumbility" p="0">{view === 'pumbility' && <UserTopFifty scores={user.scores} summary={summary} />}</Tabs.Content>
            <Tabs.Content value="recent" p="0">{view === 'recent' && <UserRecent recents={user.recents || []} />}</Tabs.Content>
        </Tabs.Root>
    );
}

export default UserScores;

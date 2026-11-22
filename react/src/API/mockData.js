import fixture from './mockData.json';

export const isMockMode = import.meta.env.DEV && import.meta.env.MODE === 'mock';

const normalize = (value) => String(value || '').replace(/\s+/g, '').replace(/^#/, '').toUpperCase();
const jacketUrl = (jacket) => `https://www.piugame.com/data/song_img/${jacket}.png`;

function currentInfo(info, index) {
    const timestamp = Math.floor(Date.now() / 1000) - (12 + index) * 60 * 60;
    return { ...info, timestamp, last_updated: new Date(timestamp * 1000).toLocaleDateString() };
}

export function mockUsers(name = '') {
    const query = normalize(name);
    return fixture.users
        .map(({ info }, index) => ({ info: currentInfo(info, index) }))
        .filter(({ info }) => !query || normalize(info.player + info.number).includes(query));
}

function legacyScores(scores) {
    return scores.reduce((groups, score, index) => {
        const key = score.type === 'c' ? score.level : String(score.level).padStart(2, '0');
        const entry = {
            ...score,
            score: score.score == null ? '' : score.score.toLocaleString('en-US'),
            rating: Math.round((score.score || 0) / 1000),
        };
        const group = groups[key] || (groups[key] = {
            scores: [], rating: 0, singles: { count: 0 }, doubles: { count: 0 },
        });
        group.scores.push(entry);
        group.rating += entry.rating;
        if (score.type === 's' || score.type === 'd') {
            group[score.type === 's' ? 'singles' : 'doubles'].count += 1;
        }
        return groups;
    }, {});
}

export function mockUser(game, name, number) {
    const match = fixture.users.find(({ info }) => (
        normalize(info.player) === normalize(name) && normalize(info.number) === normalize(number)
    ));
    const base = match || fixture.users[0];
    const userIndex = match ? fixture.users.indexOf(match) : 0;
    const info = currentInfo({
        ...base.info,
        player: String(name || base.info.player).toUpperCase(),
        number: `#${String(number || base.info.number).replace(/^#/, '')}`,
    }, userIndex);
    const scores = fixture.scores.map((score) => ({ ...score }));
    const recents = [
        ...fixture.scores.slice(0, 12),
        ...fixture.recentFailures,
    ].map((score, index) => ({
        ...score,
        date: new Date(Date.now() - index * 60 * 60 * 1000).toISOString(),
        judgments: { perfect: 1000 - index * 11, great: index * 3, good: index % 4, bad: 0, miss: 0 },
    }));

    return {
        info,
        scores: game === 'phx1' ? legacyScores(scores) : scores,
        titles: fixture.titles,
        pumbility: fixture.pumbility,
        recents,
    };
}

export function mockChartStats() {
    const counts = {};
    for (let level = 1; level <= 29; level += 1) {
        counts[String(level).padStart(2, '0')] = { total: 4, singles: 2, doubles: 2 };
    }
    counts.coop = { n2: 2, n3: 2, n4: 2, n5: 2 };
    return counts;
}

function chartFromScore(score) {
    return {
        name: score.name,
        name_kr: score.name,
        type: score.type,
        level: score.level,
        bg_img: jacketUrl(score.jacket),
    };
}

function unplayedChart(type, level) {
    return {
        name: `Unplayed Sample ${type.toUpperCase()}${level}`,
        name_kr: `Unplayed Sample ${type.toUpperCase()}${level}`,
        type,
        level,
        bg_img: jacketUrl('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    };
}

export function mockChartsForLevel(level) {
    if (level === 'coop') {
        return Object.fromEntries(['n2', 'n3', 'n4', 'n5'].map((coopLevel) => [
            coopLevel,
            fixture.scores.filter((score) => score.type === 'c' && score.level === coopLevel).map(chartFromScore)
                .concat(unplayedChart('c', coopLevel)),
        ]));
    }

    const numericLevel = Number(level);
    return Object.fromEntries(['s', 'd'].map((type) => {
        const played = fixture.scores.filter((score) => score.type === type && Number(score.level) === numericLevel);
        return [type, played.map(chartFromScore).concat(unplayedChart(type, numericLevel))];
    }));
}

export function mockSyncResult(game, name, number) {
    const user = mockUser(game, name, number);
    return {
        info: user.info,
        scores: fixture.scores.length,
        pumbility: fixture.pumbility.length,
        titles: fixture.titles.length,
        user,
    };
}

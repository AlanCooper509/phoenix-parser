import { bestFifty, gradeNeeded, isCleared, scoreValue } from './pumbility';

// Per-player numbers behind the Phoenix 2 user page, from the synced best scores and the chart
// counts per level (GET /api/phx2/charts/stats: { "01": { total, singles, doubles }, ... }).

export const TYPES = { both: ['s', 'd'], s: ['s'], d: ['d'] };
const COUNT_KEY = { both: 'total', s: 'singles', d: 'doubles' };

const levelKey = (level) => String(level).padStart(2, '0');

// Clears, averages and best-fifty membership per level, for singles, doubles or both. Averages and
// best scores count clears only (as on Phoenix (1), whose best scores only ever listed passes);
// Phoenix 2 also lists fails and STAGE BREAKs, which only count as played.
// Returns a row for every level that has charts (or plays).
export function levelRows(scores, counts, typeFilter, topFifty) {
    const types = TYPES[typeFilter];
    const played = scores.filter((s) => types.includes(s.type));
    const rows = [];
    for (let level = 1; level <= 29; level++) {
        const key = levelKey(level);
        const total = counts?.[key]?.[COUNT_KEY[typeFilter]] || 0;
        const atLevel = played.filter((s) => Number(s.level) === level);
        const cleared = atLevel.filter(isCleared);
        if (!total && !atLevel.length) {
            continue;
        }
        rows.push({
            level,
            total,
            played: atLevel.length,
            cleared: cleared.length,
            percent: total ? (100 * cleared.length) / total : 0,
            average: cleared.length ? cleared.reduce((sum, s) => sum + s.score, 0) / cleared.length : null,
            best: cleared.reduce((best, s) => Math.max(best, s.score), 0) || null,
            inTopFifty: atLevel.filter((s) => topFifty.has(s)).length,
        });
    }
    return rows;
}

// Every score's PUMBILITY value (by index, and by score in valueOf), the best fifty (as a Set of
// score objects, and in order), their total and the floor: the 50th best value, which a chart has
// to beat to count.
export function pumbilitySummary(scores) {
    const values = scores.map(scoreValue);
    const order = values.map((v, i) => i).sort((a, b) => values[b] - values[a]);
    const topIndexes = order.slice(0, 50).filter((i) => values[i] > 0);
    const { total, floor } = bestFifty(values);
    return {
        values, total, floor,
        topFifty: new Set(topIndexes.map((i) => scores[i])),
        topScores: topIndexes.map((i) => scores[i]),
        valueOf: new Map(scores.map((score, i) => [score, values[i]])),
    };
}

// For each level and type, the grade a first clear needs to count toward PUMBILITY (no plate
// assumed) and how many charts there haven't been played yet.
export function newChartTargets(scores, counts, floor) {
    const targets = [];
    for (const type of ['s', 'd']) {
        for (let level = 10; level <= 29; level++) {
            const total = counts?.[levelKey(level)]?.[type === 's' ? 'singles' : 'doubles'] || 0;
            const played = scores.filter((s) => s.type === type && Number(s.level) === level).length;
            const grade = gradeNeeded(type, level, floor);
            if (total > played && grade) {
                targets.push({ type, level, grade, unplayed: total - played });
            }
        }
    }
    return targets;
}

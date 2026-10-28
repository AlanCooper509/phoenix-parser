// Phoenix 2 PUMBILITY: each chart is worth Base(level) x (grade + plate), and a player's PUMBILITY
// is their best fifty summed. Checked against piugame.com's own numbers: every chart in a synced
// top 50 and its total match exactly. Table from piuscores.arroweclip.se/PumbilityCalculator/phoenix-2.

// grades from lowest to highest, with the score each starts at
export const GRADES = [
    ['f', 'F', 0], ['d', 'D', 500000], ['c', 'C', 600000], ['b', 'B', 700000], ['a', 'A', 800000],
    ['a_p', 'A+', 900000], ['aa', 'AA', 920000], ['aa_p', 'AA+', 940000], ['aaa', 'AAA', 950000],
    ['aaa_p', 'AAA+', 960000], ['s', 'S', 970000], ['s_p', 'S+', 975000], ['ss', 'SS', 980000],
    ['ss_p', 'SS+', 985000], ['sss', 'SSS', 990000], ['sss_p', 'SSS+', 995000],
];
const GRADE_INDEX = Object.fromEntries(GRADES.map(([key], i) => [key, i]));

const DOUBLE_GRADE = {
    f: 1.00, d: 1.10, c: 1.20, b: 1.25, a: 1.30, a_p: 1.35, aa: 1.37, aa_p: 1.39,
    aaa: 1.41, aaa_p: 1.43, s: 1.45, s_p: 1.46, ss: 1.47, ss_p: 1.48, sss: 1.49, sss_p: 1.50,
};
// singles read AA and below a notch lower
const SINGLE_GRADE = { ...DOUBLE_GRADE, f: 0.90, d: 1.00, c: 1.10, b: 1.20, a: 1.28, a_p: 1.33, aa: 1.36 };

const DOUBLE_PLATE = { rg: 0, fg: 0.002, tg: 0.004, mg: 0.006, sg: 0.008, eg: 0.012, ug: 0.016, pg: 0.020 };
const SINGLE_PLATE = { ...DOUBLE_PLATE, eg: 0.014, ug: 0.017 };

export const PLATE_NAMES = {
    rg: 'Rough Game', fg: 'Fair Game', tg: 'Talented Game', mg: 'Marvelous Game',
    sg: 'Superb Game', eg: 'Extreme Game', ug: 'Ultimate Game', pg: 'Perfect Game',
};

// 130 + 5 per level, and 5 more per level above 24
function base(level) {
    return 130 + 5 * level + 5 * Math.max(0, level - 24);
}

// a grade's place from F (0) to SSS+ (15), a fail counting as the grade it reached; null if none
export function gradeRank(grade) {
    const passed = grade?.replace(/^x_/, '');
    return passed in GRADE_INDEX ? GRADE_INDEX[passed] : null;
}

export function gradeLabel(grade) {
    const passed = grade?.replace(/^x_/, '');
    return GRADES[GRADE_INDEX[passed]]?.[1] || null;
}

// a play counts once it's cleared: not a STAGE BREAK (no grade) or a fail (x_ grade)
export function isCleared(score) {
    return Boolean(score.grade) && !score.grade.startsWith('x_') && score.grade in GRADE_INDEX;
}

// What a chart is worth toward PUMBILITY with this grade and plate. Singles are priced one level
// up; co-op, U.C.S., levels below 10 and uncleared plays are worth nothing.
export function chartValue(type, level, grade, plate) {
    const lv = Number(level);
    if ((type !== 's' && type !== 'd') || !(lv >= 10) || !(grade in GRADE_INDEX)) {
        return 0;
    }
    const single = type === 's';
    const multiplier = (single ? SINGLE_GRADE : DOUBLE_GRADE)[grade];
    const bonus = (single ? SINGLE_PLATE : DOUBLE_PLATE)[plate] || 0;
    // piugame drops fractions of a cent (371.665 counts as 371.66); the small nudge keeps float
    // error from flooring 372.32 down to 372.31
    return Math.floor((single ? base(lv + 1) : base(lv)) * (multiplier + bonus) * 100 + 1e-6) / 100;
}

export function scoreValue(score) {
    return isCleared(score) ? chartValue(score.type, score.level, score.grade, score.plate) : 0;
}

// The lowest grade a first clear of a chart needs to be worth more than `floor` (no plate assumed),
// or null if even SSS+ wouldn't be.
export function gradeNeeded(type, level, floor) {
    return GRADES.find(([key]) => chartValue(type, level, key, null) > floor) || null;
}

// PUMBILITY from singles alone or doubles alone (`type` 's' or 'd'), or both (no type): the best
// fifty, as piugame shows for its [S] and [D] titles. Singles keep their one-level-up pricing.
// `counted` is how many charts are worth anything (cleared, Lv.10 and up), at most 50: below 50
// the best fifty isn't full yet, and every new clear adds to it.
export function typePumbility(scores, type) {
    const values = scores.filter((s) => !type || s.type === type).map(scoreValue);
    return { total: bestFifty(values).total, counted: Math.min(50, values.filter((v) => v > 0).length) };
}

// The best fifty values and their sum, from a list of chart values (unsorted).
export function bestFifty(values) {
    const top = [...values].sort((a, b) => b - a).slice(0, 50);
    return { top, total: top.reduce((sum, v) => sum + v, 0), floor: top.length === 50 ? top[49] : 0 };
}

// The PUMBILITY each tier starts at. Every tier below ABYSS ABSOLUTE has five levels, evenly
// spaced up to the next tier (BRONZE Lv.2 at 10,500, ...); icons count up from BRONZE Lv.1 (1)
// to ABYSS ABSOLUTE (36).
const TIER_STARTS = [
    ['BRONZE', 10000], ['SILVER', 12500], ['GOLD', 15000], ['PLATINUM', 16000],
    ['DIAMOND', 17000], ['RED BERYL', 18000], ['ALEXANDRITE', 19000], ['ABYSS ABSOLUTE', 20000],
];
const TIER_MILESTONES = TIER_STARTS.flatMap(([name, start], i) => {
    const next = TIER_STARTS[i + 1];
    if (!next) {
        return [{ name, value: start, icon: i * 5 + 1, tier: true }];
    }
    const step = (next[1] - start) / 5;
    return [1, 2, 3, 4, 5].map((level) => ({
        name: `${name} Lv.${level}`, value: start + step * (level - 1), icon: i * 5 + level, tier: true,
    }));
});

// piugame's singles and doubles PUMBILITY titles (my_page/title.php): INTERMEDIATE every 1,000
// from 5,000, ADVANCED every 250 (singles) or 300 (doubles) from 15,000, EXPERT at the points
// listed, then MASTER. Each carries the title color piugame shows it in (col1 bronze ... col7
// purple), per level of each rank.
function titleMilestones(prefix, advancedStep, expert, colors, master) {
    const steps = (from, step) => Array.from({ length: 10 }, (_, i) => from + step * i);
    const levels = (rank, starts) => starts.map((value, i) => {
        const name = `[${prefix}] ${rank} LV.${i + 1}`;
        return { name, value, title: { text: name, color: `col${colors[rank][i]}` } };
    });
    return [
        ...levels('INTERMEDIATE', steps(5000, 1000)),
        ...levels('ADVANCED', steps(15000, advancedStep)),
        ...levels('EXPERT', expert),
        { ...master, title: { text: master.name, color: 'col7' } },
    ];
}
export const SINGLE_MILESTONES = titleMilestones(
    'S', 250, [17500, 17700, 17900, 18100, 18300, 18500, 18600, 18700, 18800, 18900],
    {
        INTERMEDIATE: [1, 1, 1, 1, 1, 1, 1, 2, 2, 2],
        ADVANCED: [3, 3, 4, 4, 4, 4, 5, 5, 5, 5],
        EXPERT: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7],
    },
    { name: 'SINGLE MASTER', value: 19000 },
);
export const DOUBLE_MILESTONES = titleMilestones(
    'D', 300, [18000, 18200, 18400, 18600, 18800, 19000, 19100, 19200, 19300, 19400],
    {
        INTERMEDIATE: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2],
        ADVANCED: [3, 3, 3, 3, 4, 4, 4, 5, 5, 5],
        EXPERT: [6, 6, 6, 6, 6, 7, 7, 7, 7, 7],
    },
    { name: 'DOUBLE MASTER', value: 19500 },
);

// Where a value sits between the milestone reached (null below the first) and the next one (null
// past the last), as a percentage of the way there.
export function progressAlong(milestones, value) {
    const index = milestones.findLastIndex((m) => value >= m.value);
    const current = milestones[index] || null;
    const next = milestones[index + 1] || null;
    const from = current?.value || 0;
    return {
        current, next,
        percent: next ? (100 * (value - from)) / (next.value - from) : 100,
        remaining: next ? next.value - value : 0,
    };
}

// the same for PUMBILITY tiers (BRONZE Lv.1 ... ABYSS ABSOLUTE)
export function pumbilityProgress(value) {
    return progressAlong(TIER_MILESTONES, value);
}

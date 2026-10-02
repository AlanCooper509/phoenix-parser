import 'dotenv/config';

// Pump It Up PHOENIX (1): where its data lives and how its ratings are scored
const phx1 = {
    id: "phx1",

    // private bucket: express-build/users/<NAME#NUM>/ (kept at its original, pre-split location)
    usersDir: process.env.USERS_DIR,
    // ADB collection backing user search
    usersCollection: "info_collection",
    // public piu-assets bucket
    chartsDir: "phx1/charts",
    // scraper run by /sync
    syncScript: process.env.PYTHON_SCRIPT,

    gradeMultipliers: {
        "f":     0.40,
        "d":     0.50,
        "c":     0.60,
        "b":     0.70,
        "a":     0.80,
        "a_p":   0.90,
        "aa":    1.00,
        "aa_p":  1.05,
        "aaa":   1.10,
        "aaa_p": 1.15,
        "s":     1.20,
        "s_p":   1.26,
        "ss":    1.32,
        "ss_p":  1.38,
        "sss":   1.44,
        "sss_p": 1.50
    },

    levelMultipliers: {
        "10": 100,
        "11": 110,
        "12": 130,
        "13": 160,
        "14": 200,
        "15": 250,
        "16": 310,
        "17": 380,
        "18": 460,
        "19": 550,
        "20": 650,
        "21": 760,
        "22": 880,
        "23": 1010,
        "24": 1150,
        "25": 1300,
        "26": 1460,
        "27": 1630,
        "28": 1810,
        "29": 2000,
        "coop": 2200
    },
};

export default phx1;

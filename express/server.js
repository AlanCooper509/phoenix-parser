// external packages
import express from 'express';
import cors from 'cors';

// local helpers
import { DEFAULT_GAME, getGame } from './games/index.js';
import getUser from './endpoints/user.js';
import getUsers from './endpoints/users.js';
import getChartStats from './endpoints/chartstats.js';
import getChartsForLevel from './endpoints/chartsforlevel.js';
import syncUser from './endpoints/syncuser.js';

// script logic
const app = express();
app.use(cors());
const port = 3001;

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// endpoints resolve to output or { error: { code, message } }
function respond(label, res, promise) {
  promise.then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[${label}] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
}

// every API route, for the game in req.game
const api = express.Router();

// [GET] USER
api.get('/user/:name/:number', (req, res) => {
  respond("GET USER", res, getUser(req, req.game));
});

// [GET] USERS
api.get('/users/', (req, res) => {
  respond("GET USERS", res, getUsers(req, req.game));
});

// [GET] USERS WITH NAME
api.get('/users/:name', (req, res) => {
  respond("GET (NAME) USERS", res, getUsers(req, req.game));
});

// [GET] CHART STATS
api.get('/charts/stats', (req, res) => {
  respond("GET CHART STATS", res, getChartStats(req.game));
});

// [GET] CHARTS FOR LEVEL
api.get('/charts/level/:value', (req, res) => {
  respond("GET CHARTS FOR LEVEL", res, getChartsForLevel(req, req.game));
});

// [POST] SYNC USER
api.post('/sync/:name/:number', (req, res) => {
  req.setTimeout(15*60*1000);
  const name = req.params.name.toUpperCase();
  const number = req.params.number;
  const sid = req.body.sid;
  respond("SYNC USER", res, syncUser(sid, name, number, req.game));
});

// pre-split URLs (/api/user/...) are Phoenix (1); matched first, so a game can't be named "user", "users", "charts" or "sync"
app.use('/api', (req, res, next) => {
  req.game = getGame(DEFAULT_GAME);
  next();
}, api);

// /api/<game>/...
app.use('/api/:game', (req, res, next) => {
  req.game = getGame(req.params.game);
  if (!req.game) {
    res.status(404).send(`Unknown game: ${req.params.game}`);
    return;
  }
  next();
}, api);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// external packages
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// local helpers
import getUser from './endpoints/user.js';
import getUsers from './endpoints/users.js';
import getChartStats from './endpoints/chartstats.js';
import getChartsForLevel from './endpoints/chartsforlevel.js';
import syncUser from './endpoints/syncuser.js';

// script logic
const app = express();
app.use(cors());
const port = 3001;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// [GET] USER
app.get('/api/user/:name/:number', async (req, res) => {
  getUser(req).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[GET USER] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

// [GET] USERS
app.get('/api/users/', async (req, res) => {
  getUsers(req).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[GET USERS] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

// [GET] USERS WITH NAME
app.get('/api/users/:name', async (req, res) => {
  getUsers(req).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[GET (NAME) USERS] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

// [GET] CHART STATS
app.get('/api/charts/stats', async (req, res) => {
  getChartStats().then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[GET CHART STATS] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

// [GET] CHARTS FOR LEVEL
app.get('/api/charts/level/:value', async (req, res) => {
  getChartsForLevel(req).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }  
  }).catch((err) => {
    console.log(`[GET CHARTS FOR LEVEL] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

app.post('/api/sync/:name/:number', async (req, res) => {
  req.setTimeout(15*60*1000);
  const name = req.params.name.toUpperCase();
  const number = req.params.number;
  const sid = req.body.sid;

  syncUser(sid, name, number).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  }).catch((err) => {
    console.log(`[SYNC USER] ERROR: ${err}`);
    res.status(500).send("Internal Server Error");
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
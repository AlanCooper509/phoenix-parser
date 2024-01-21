// external packages
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// local helpers
import getUser from './endpoints/user.js';
import getChartStats from './endpoints/chartstats.js';
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
  });
});

app.post('/api/sync/:name/:number', async (req, res) => {
  const name = req.params.name.toUpperCase();
  const number = req.params.number;
  const sid = req.body.sid;

  syncUser(sid, name, number).then((output) => {
    if (output.error) {
      res.status(output.error.code).send(output.error.message);
    } else {
      res.json(output);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
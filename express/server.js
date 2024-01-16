// external packages
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// local helpers
import getUser from './endpoints/user.js';
import getChartStats from './endpoints/chartstats.js';
import postSyncUser from './endpoints/sync.js';

// script logic
const app = express();
app.use(cors());
const port = 3001;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/api/user/:name/:number', (req, res) => {
  const output = getUser(req);
  if (output.error) {
    res.status(output.error.code).send(output.error.message);
  } else {
    res.json(output);
  }
});

app.get('/api/charts/stats', (req, res) => {
  const output = getChartStats(req);
  if (output.error) {
    res.status(output.error.code).send(output.error.message);
  } else {
    res.json(output);
  }
});

app.post('/api/sync/:name/:number', async (req, res) => {
  const name = req.params.name.toUpperCase();
  const number = req.params.number;
  const sid = req.body.sid;

  postSyncUser(name, number, sid).then((output)=> {
    console.log("DONE");
    console.log(output);
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
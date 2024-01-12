// external packages
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';

// local helpers
import getUser from './endpoints/user.js';

// code logic
const app = express();
app.use(cors());
const port = 3001;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/api/user/:id/:number', (req, res) => {
  const output = getUser(req);
  const data = { message: output };
  // Handle your API logic here
  // const file = fs.readFileSync("charts/v1_05_0/fullmode.json", "utf8");
  // const  a = JSON.parse(file);
  // const data = { message: 'Hello from the server!' };
  res.json(data);
});

app.post('/api/post', (req, res) => {
  // Handle your API logic here
  console.log(req.body);
  const data = { message: 'Hello from the server!' };
  res.json(data);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
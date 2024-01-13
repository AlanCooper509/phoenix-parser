// external packages
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// local helpers
import getUser from './endpoints/user.js';

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

// app.post('/api/post', (req, res) => {
//   // Handle your API logic here
//   console.log(req.body);
//   const data = { message: 'Hello from the server!' };
//   res.json(data);
// });

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
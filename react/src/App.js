import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import UserPage from "./UserPage/UserPage.js";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={"try URL/user/<name>/<number>"} />
        <Route path="/user/:name/:number" element={<UserPage/>} />
      </Routes>
    </Router>
  );
}

export default App;

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LaunchPage from "./LaunchPage/LaunchPage";
import UserPage from "./UserPage/UserPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LaunchPage/>} />
        <Route path="/user/:name/:number" element={<UserPage/>} />
      </Routes>
    </Router>
  );
}

export default App;

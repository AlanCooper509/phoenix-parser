import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';

import LaunchPage from "./LaunchPage/LaunchPage";
import UserPage from "./UserPage/UserPage";

// a fresh UserPage per user (tabs only change :tab, which keeps the same page)
function UserRoute() {
  const { name, number } = useParams();
  return <UserPage key={`${name}#${number}`}/>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LaunchPage/>} />
        <Route path="/user/:name/:number" element={<UserRoute/>} />
        <Route path="/user/:name/:number/:tab" element={<UserRoute/>} />
      </Routes>
    </Router>
  );
}

export default App;

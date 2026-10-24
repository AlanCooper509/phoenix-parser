import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

import LaunchPage from "./LaunchPage/LaunchPage";
import UserPage from "./UserPage/UserPage";
import { LEGACY_GAME, getGame } from "./games";
import { userPath } from "./Helpers/paths";

// PROTOTYPE Phoenix 2 home page: loaded only when /phx2 is visited, so Chakra UI and its
// dependencies stay out of the bundle for the Phoenix (1) pages
const Phx2Home = lazy(() => import("./Phx2Home/Phx2Home"));

// a fresh UserPage per game/user (tabs only change :tab, which keeps the same page)
function UserRoute() {
  const { game, name, number } = useParams();
  if (!getGame(game)) {
    return <Navigate to="/" replace/>;
  }
  return <UserPage key={`${game}/${name}#${number}`}/>;
}

// links from before the game was part of the URL
function LegacyUserRedirect() {
  const { name, number, tab } = useParams();
  return <Navigate to={userPath(LEGACY_GAME, name, number, tab)} replace/>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LaunchPage/>} />
        {/* PROTOTYPE: Phoenix 2 home page (Chakra UI) */}
        <Route path="/phx2" element={<Suspense fallback={null}><Phx2Home/></Suspense>} />
        <Route path="/:game/user/:name/:number" element={<UserRoute/>} />
        <Route path="/:game/user/:name/:number/:tab" element={<UserRoute/>} />
        <Route path="/user/:name/:number" element={<LegacyUserRedirect/>} />
        <Route path="/user/:name/:number/:tab" element={<LegacyUserRedirect/>} />
      </Routes>
    </Router>
  );
}

export default App;

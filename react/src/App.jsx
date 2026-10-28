import { lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';

import LaunchPage from "./LaunchPage/LaunchPage";
import UserPage from "./UserPage/UserPage";
import { LEGACY_GAME, getGame } from "./games";
import { userPath } from "./Helpers/paths";

// Phoenix 2 pages: loaded only when visited, so Chakra UI and its dependencies stay
// out of the bundle for the Phoenix (1) pages
const Phx2Home = lazy(() => import("./Phx2/Phx2Home"));
const Phx2User = lazy(() => import("./Phx2/Phx2User"));

// Phoenix (1) pages are Bootstrap; once a Phoenix 2 page has loaded, its global Chakra styles (and
// Phx2.css) stay in the page and restyle them (no list bullets, block images, ...), so reaching one
// from Phoenix 2 inside the app (a link, or back/forward) loads it fresh instead. Each also gets a
// slim bar back to Phoenix 2.
function LegacyPage({ children }) {
  if (window.phx2StylesLoaded) {
    window.location.reload();
    return null;
  }
  return (
    <>
      <div className="legacy-bar">
        You're on the Phoenix 1 (legacy) tracker. <Link to="/">Go to Phoenix 2</Link>
      </div>
      {children}
    </>
  );
}

// a fresh UserPage per game/user (tabs only change :tab, which keeps the same page)
function UserRoute() {
  const { game, name, number } = useParams();
  if (!getGame(game)) {
    return <Navigate to="/" replace/>;
  }
  return <LegacyPage><UserPage key={`${game}/${name}#${number}`}/></LegacyPage>;
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
        {/* Phoenix 2 is the home page; the Phoenix (1) launch page moved to /phx1 */}
        <Route path="/" element={<Suspense fallback={null}><Phx2Home/></Suspense>} />
        <Route path="/phx1" element={<LegacyPage><LaunchPage/></LegacyPage>} />
        <Route path="/phx2" element={<Navigate to="/" replace/>} />
        <Route path="/phx2/user/:name/:number" element={<Suspense fallback={null}><Phx2User/></Suspense>} />
        <Route path="/phx2/user/:name/:number/:tab" element={<Suspense fallback={null}><Phx2User/></Suspense>} />
        <Route path="/phx2/user/:name/:number/:tab/:view" element={<Suspense fallback={null}><Phx2User/></Suspense>} />
        <Route path="/:game/user/:name/:number" element={<UserRoute/>} />
        <Route path="/:game/user/:name/:number/:tab" element={<UserRoute/>} />
        <Route path="/user/:name/:number" element={<LegacyUserRedirect/>} />
        <Route path="/user/:name/:number/:tab" element={<LegacyUserRedirect/>} />
      </Routes>
    </Router>
  );
}

export default App;

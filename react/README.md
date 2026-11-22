# Phoenix Trackers (frontend)

React app built with [Vite](https://vite.dev).

## Scripts

- `npm run dev` (or `npm start`): dev server on http://localhost:3000. Expects the Express API on port 3001 of the same host (see `src/API/getHostPath.js`).
- `npm run dev:mock`: development server with imported sample data; no Express API or database required.
- `npm run build`: production build into `build/`.
- `npm run preview`: serve the production build locally.

With `npm run dev:mock`, open http://localhost:3000 and use the home-page search or sample player cards as usual. The mock mode covers user lookup, player pages, chart stats/lists, and sync responses.

## Deploy

The build output stays in `build/` (set in `vite.config.mjs`), so deploys are unchanged:

```
pm2 serve <build folder> 3000 --spa
```

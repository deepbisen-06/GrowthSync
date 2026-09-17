# Cleanup report

## Scope

Cleaned the supplied archive while retaining connected Milestone 1 and Milestone 2
features. No deployment, database modification, model training or Git push was done.

## Removed from delivery

| Item | Reason |
| --- | --- |
| Bundled Python virtual environment (14,379 files) | Machine-specific installed dependencies; recreate from requirements |
| Bundled node_modules (4,953 files) | Reinstall using package-lock.json and npm ci |
| Embedded Git database (130 files) | Source delivery does not need repository internals; use the existing checkout to preserve history |
| Python bytecode (59 files), pytest cache | Generated local caches |
| frontend/dist | Generated build output; regenerate using npm run build |
| frontend/src/components/Navbar.jsx | No imports/references; current app uses DashboardSidebar and DashboardHeader |
| frontend/src/App.css | Not imported; main.jsx loads index.css |
| frontend/src/assets/hero.png, react.svg, vite.svg | Unreferenced starter assets |
| frontend/public/icons.svg | Unreferenced starter sprite |
| Local environment credentials | Excluded from shareable source; .env.example remains |

Original synthetic CSVs were moved to `datasets/examples/`, not deleted.
Original model modules, routes, screens, database scripts, migrations and tests
were retained. Frontend package-lock.json was retained.

## Code and documentation changes

- Applied consistent Python formatting and import ordering; removed unused imports.
- Applied consistent JavaScript/JSX/CSS formatting and removed unused icon imports,
  variables, catch bindings and props where safe.
- Preserved intentional model-registration imports used for SQLAlchemy metadata.
- Removed an unused simulation intermediate without changing its formula.
- Released the CSV download object URL after use.
- Replaced the hardcoded database-connected notification with a neutral product tip.
- Updated stale API project labels and replaced template/overstated README content.
- Added editor and Python lint configuration, dataset ignore patterns and milestone map.
- Added standalone CSV preparation with provenance reporting and contract tests.

## Verification performed

| Check | Result |
| --- | --- |
| Frontend dependency installation from existing lockfile | Passed with npm ci |
| Frontend production build | Passed, Vite 8.2.2 on Node 24.19.0 |
| Frontend lint | Exit 0, 8 warnings remaining; no unused-import/variable warnings |
| Python Ruff lint | Passed |
| Python Ruff formatting | 63 Python files conform |
| Python compilation | Passed |
| FastAPI application import | Passed; does not establish database connectivity |
| New dataset preparation tests | 6 passed; use explicitly artificial test fixtures |
| Full existing API integration suite | Not run: no disposable PostgreSQL database configured |
| Live browser/auth/forecasting workflow | Not verified end to end |
| Real Kaggle download / training / inference integration | Not performed |

## Remaining work

The React warnings concern effect-based state updates, context fast-refresh exports
and simulator effect dependencies. They are documented rather than hidden by
turning off lint rules. The simulator also merits async request-race review.

Before using a shared deployment, address cross-user CSV export authorization,
linkable identifiers and free-text fields; current exports are not fully anonymous.
Before claiming validated forecasts, review chronological evaluation and study-week
aggregation across year boundaries. Existing personal scores include fixed rules;
confidence labels are not calibrated probabilities.

The original backend dependencies remain minimum-version requirements. A full
PostgreSQL test run in a clean environment is needed before selecting and publishing
a tested backend lockfile. A successful build alone does not establish production readiness.

# Working Agreement

This agreement governs changes to the Contribution Search project, including work by coding agents and other AI-assisted tools.

## Intended scope of changes

- Keep changes focused on contribution search correctness: case-insensitive literal matching on titles and owners, deterministic ordering, pagination and validation, accessible loading, empty, and error states, and stale-response handling.
- Preserve the existing FastAPI backend, Next.js frontend, API contract, and in-memory JSON data unless the project owner explicitly changes the scope.
- Do not add authentication, authorization, a database, deployment infrastructure, monitoring platforms, or unrelated product features as part of search work.
- Prefer the smallest change that solves the request. Avoid changing unrelated code.

## Verification commands

Run relevant checks for each code change and report any checks that could not run. Commands below use Windows CMD.

From the project root, run backend tests:

```cmd
.venv\Scripts\python.exe -m pytest backend\tests
```

From `frontend`, run unit tests and a production build:

```cmd
npm test
npm run build
```

Browser tests require both servers to be running. Install Chromium once if needed:

```cmd
npx playwright install chromium
```

Start FastAPI from the project root:

```cmd
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --port 8000
```

Build and start Next.js from `frontend` in another CMD window:

```cmd
npm run build
npm start
```

Run browser tests from `frontend` in a third CMD window:

```cmd
npm run test:e2e
```

For search changes, check case-insensitive and literal terms, whitespace-only input, totals, sorting, pagination validation and page changes, query reset to page 1, empty results, error and retry states, and overlapping requests as applicable.

## Dependency boundaries

- Backend dependencies belong in `backend/requirements.txt`. Keep API routing, validation, and in-memory search in FastAPI.
- Frontend dependencies belong in `frontend/package.json`, with exact versions recorded in `frontend/package-lock.json`. Keep UI state, accessibility, and rendering in Next.js.
- The browser requests the same-origin `/api/*` path. `frontend/next.config.ts` forwards it to FastAPI. Do not duplicate the search algorithm in the frontend.
- Avoid new packages or services when current dependencies can meet the requirement. Document the reason for any new dependency.

## Restrictions on destructive actions

- Do not delete or overwrite user files, contribution data, or project history as cleanup without explicit authorization.
- Do not run destructive Git operations such as `reset --hard`, force pushes, or history rewrites without explicit authorization.
- Do not remove dependencies, tests, or documentation merely because they appear unused. Check references and explain the proposed removal first.
- Check exact target paths before any authorized recursive delete or move.

## Review process for generated code

- Treat AI-generated code and configuration as a proposal. Read the complete diff and check it against the request and project conventions.
- Review API compatibility, validation, accessibility, error handling, and security implications for affected behavior.
- Check that generated tests cover intended behavior and do not weaken or remove meaningful expectations.
- Run relevant verification commands. Report what was run and its result; do not claim checks passed unless they were executed.
- Keep generated files and lockfile changes only when required, and inspect their full diff.

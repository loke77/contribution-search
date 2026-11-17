# Contribution Search

A FastAPI and Next.js application for searching contributions by title or owner. Search uses case-insensitive, literal substring matching. Results are sorted by start time and ID before pagination. The app uses the bundled JSON dataset and does not require a database or sign-in.

## Requirements

- Python 3.12
- Node.js 22 and npm

## Run locally on Windows

Open two Command Prompt windows.

**Window 1: start FastAPI**

From the project root:

```cmd
cd "E:\contribution-restructured\contribution"
.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.venv\Scripts\python.exe -m uvicorn backend.app.main:app --reload --port 8000
```

**Window 2: start Next.js**

```cmd
cd  "E:\contribution-restructured\contribution\frontend"
npm ci
npm run dev
```

Open http://localhost:3000. Next.js forwards `/api/contributions` to FastAPI at `http://127.0.0.1:8000`. FastAPI docs are at `http://127.0.0.1:8000/docs`.

Install dependencies once. On later runs, start each server with its Uvicorn or `npm run dev` command.

## Run the tests

**Backend tests** run from the project root. The servers do not need to be running.

```cmd
cd  "E:\contribution-restructured\contribution"
.venv\Scripts\python.exe -m pytest backend\tests
```

**Frontend unit tests** run from the frontend folder. The servers do not need to be running.

```cmd
cd  "E:\contribution-restructured\contribution\frontend"
npm test
```

**Browser tests** need both services running. Start the backend as above. In the frontend window, build and start the production server.

```cmd
cd  "E:\contribution-restructured\contribution\frontend"
npx playwright install chromium
npm run build
npm start
```

Keep that frontend window open. In a third Command Prompt window, run:

```cmd
cd "E:\contribution-restructured\contribution\frontend"
npm run test:e2e
```

Install Chromium once. Stop the servers with `Ctrl+C` when finished.

## Verify behavior manually

1. Open the app. The contribution directory should appear directly with no sign-in.
2. Search for `report`. Results should include **Reporting API** and **Quarterly revenue report**.
3. Search for `SARAH`. Results should include contributions owned by **Sarah Jones**, regardless of capitalization.
4. Search for `.`, `[`, `]`, `*`, `+`, and `?`. Treat each as literal text. For example, `.` matches only records with an actual period.
5. Search for `__no_matching_contribution__`. The page should show an empty state and zero results. Clear the query and confirm the directory returns.
6. Search for a common term, go to page 2, then replace the query. The page number should reset to 1 and the results should update.
7. With the app open, stop FastAPI with `Ctrl+C`, then change the query. Confirm the error and retry option appears. Restart FastAPI and retry. Results should load again.
8. Resize the browser to 375 pixels wide. Confirm the search and pagination controls remain usable without horizontal page overflow.

## Search API

`GET /api/contributions` accepts:

- `q`: optional search text. Matching is case-insensitive and literal. Empty or whitespace-only text does not filter results.
- `page`: one-based page number, default `1`.
- `page_size`: number of items, default `8`, maximum `100`.

The response contains the page of items and the total number of matching records before pagination. Invalid pagination values return HTTP `422`. Responses with matches include RFC 8288 pagination links in the HTTP `Link` header.

## Project structure

```text
backend/
  app/
    api/routes/contributions.py
    data/contributions.json
    schemas/contributions.py
    main.py
  tests/
frontend/
  src/
    app/
    features/contributions/
  tests/
docs/
  scalability.md
```

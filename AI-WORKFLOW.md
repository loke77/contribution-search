# AI Workflow

## Tasks delegated to AI tools

Three parallel reviews were used for the production-structure follow-up:

- REST API standards review. It proposed pagination links and OpenAPI documentation for the existing endpoint.
- Security review. It examined response headers, host validation, API documentation visibility, and whether JWT was warranted.
- Scalability review. It documented current search costs and a staged measurement and scaling plan.

## Decisions retained

- Keep the submission focused on the stated search requirements and maintain the existing FastAPI and Next.js split.
- Keep contribution data in the bundled JSON file. Do not add a database or deployment platform.
- Preserve the endpoint, response body, search semantics, sorting, and pagination validation. Retain the additive HTTP `Link` pagination header and security headers from the review.
- Exclude authentication and authorization because the brief lists them as out of scope.

## AI-generated output corrected or rejected

The security review produced an in-memory JWT login and project-permission implementation. After checking it against the assignment scope, that feature was removed from the submitted project. The current app has no sign-in screen or project filtering and searches all 33 sample contributions. The JWT version was kept separate as an interview demonstration.
Also for verifying test cases hardcoded data was used and changed to dynamic ones. Also the folder structures that matches to production grade was implemented before it was a single file .

## Checks actually executed

On the current search-only project:

- Backend: `python -m pytest backend/tests` — 26 passed, with one Starlette/AnyIO deprecation warning.
- Frontend unit: `npm test` — 2 passed.
- Production build: `npm run build` — completed successfully.
- Browser tests against the production Next.js build and FastAPI: `npm run test:e2e` — 2 passed.

The production proxy was also checked manually and returned all 33 contributions without login. The browser tests exercised search, pagination, empty results, mobile layout, and request failure and retry.


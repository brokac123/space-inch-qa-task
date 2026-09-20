# GSRI API Test Suite

[![API tests](https://github.com/brokac123/space-inch-qa-task/actions/workflows/api-tests.yml/badge.svg)](https://github.com/brokac123/space-inch-qa-task/actions/workflows/api-tests.yml)

API test suite for the **Global Shipping Rate Integrator (GSRI)** - Space Inch technical evaluation task (Part 2).

**Live test report:** https://brokac123.github.io/space-inch-qa-task/ (published by CI on every push to `main`)

**At a glance:** 4 spec files and 30 tests covering functional validation, state persistence, contract validation
and negative scenarios.

The suite runs against JSONPlaceholder, which stands in for two services:

| Endpoint | Represents | Domain model |
| --- | --- | --- |
| `/posts` | Shipping Rates Service | `ShippingRate` |
| `/users` | Customer Profile Service | `CustomerProfile` |

The test code speaks the shipping domain (`getRate`, `createQuote`, `getRatesByCustomer`) rather than
JSONPlaceholder's.

---

## Quick start

Requirements: **Node.js 20 or newer**; developed and verified on Node 24, which is also what CI runs.

```bash
git clone https://github.com/brokac123/space-inch-qa-task.git
cd space-inch-qa-task
npm ci
cp .env.example .env        # Windows: copy .env.example .env
npm test
```

| Command | What it does |
| --- | --- |
| `npm test` | runs every spec headlessly and writes the HTML report to `cypress/reports/index.html` |
| `npm run cy:open` | opens the Cypress runner for interactive debugging |
| `npm run typecheck` | type-checks the suite without running it (also runs in CI) |

To run a single spec:

```bash
npx cypress run --spec cypress/e2e/negativeTesting.cy.ts
```

### Configuration

No URL or credential is hardcoded in the test code. Both values come from the environment:

| Variable | Purpose |
| --- | --- |
| `BASE_URL` | base URL of the API under test |
| `FIRST_NAME_LETTER` | first letter of the tester's name, used by the bonus test |

Locally they are read from `.env` (ignored by git, template in `.env.example`); in CI they are provided by the
workflow. If either is missing the run stops immediately with an explicit error instead of silently using a default.

A real environment variable always wins over `.env`, which makes one-off runs easy:

```bash
FIRST_NAME_LETTER=K npm test          # bash
$env:FIRST_NAME_LETTER="K"; npm test  # PowerShell
```

Note: `cypress open` resolves the configuration once at startup, so restart it after editing `.env`.

---

## Project structure

```
cypress/
  e2e/                      one spec per task requirement
    functionalValidation.cy.ts    GET /posts/{id}, customer mapping, username bonus
    statePersistence.cy.ts        POST /posts, Location header, storage bonus
    contractValidation.cy.ts      JSON schema checks for both services
    negativeTesting.cy.ts         non-existent resources + known bugs
  services/                 Service Object pattern
    BaseService.ts                shared cy.request layer (paths, failOnStatusCode)
    ShippingRatesService.ts       /posts
    CustomerProfileService.ts     /users
  models/                   TypeScript types for the API payloads
  schemas/                  predefined JSON schemas (+ listOf helper)
  fixtures/                 test data that drives the specs
  support/commands.ts       cy.validateSchema() - Ajv with readable errors
scripts/ciSummary.js        builds the GitHub Actions job summary
.github/workflows/          CI pipeline
```

---

## Tooling, and why

| Choice | Reason |
| --- | --- |
| **Cypress + TypeScript** | the stack I use daily, so I can maintain and extend it confidently; `cy.request()` covers API testing, and TypeScript gives typed responses and catches mistakes before a run. |
| **Service Object pattern** | each service owns its endpoint knowledge, while shared HTTP behaviour (request options, URL building, status handling) is centralised in `BaseService`. Specs call business methods and never build URLs. |
| **Ajv + JSON Schema** | schema validation is the industry standard for contract checks; `allErrors` reports every violation at once and the custom command turns them into readable assertions. |
| **mochawesome** | self-contained HTML report with charts, easy to publish as a CI artifact and to GitHub Pages. |
| **GitHub Actions** | verifies the suite on a clean machine on every push, publishes the report, and proves the project runs from a fresh clone. |

### Data-driven testing

Specs import fixtures and generate one test per data set, so each data set gets its own name and result:

```ts
existingRates.forEach(({ id, customerId }) => { it(`belongs to existing customer ${customerId}`, ...) });
```

Extending coverage usually means adding data, not code - BUG-04 below was added as a single fixture entry.

---

## Coverage

| Task requirement | Spec | Highlights |
| --- | --- | --- |
| 1. Functional validation (`GET /posts/{id}`) | `functionalValidation.cy.ts` | rates 1 / 50 / 100 from a fixture; each rate's `userId` resolved against `/users`; all 100 rates cross-checked for orphans in 2 requests |
| 1. Bonus (username initial) | `functionalValidation.cy.ts` | the letter comes from config, matching is case-insensitive, several matches are supported, and no match fails with a clear message |
| 2. State persistence (`POST /posts`) | `statePersistence.cy.ts` | 3 carrier payloads, each verified for `201`, the echoed payload and a matching `Location` header; one further test checks the assigned id cannot collide with existing rates |
| 2. Bonus (stored data) | `statePersistence.cy.ts` | the POST response is verified to echo the sent quote plus a new id, then the follow-up `GET` asserts the mock's real `404` (see assumption 1) |
| 3. Contract / schema | `contractValidation.cy.ts` | single, list, filtered list and POST response for rates; single and list for customers; status, `Content-Type` and schema in one check |
| 4. Negative testing | `negativeTesting.cy.ts` | ids `99999`, `0`, `-1`, `abc` and an unknown customer; plus the known bugs below |

## CI

`.github/workflows/api-tests.yml` runs on every push to `main`, on pull requests, and on demand
(`workflow_dispatch`):

1. `npm ci` on a clean runner
2. `npm run typecheck`
3. `npm test`
4. publish a pass/fail summary table to the run page (`scripts/ciSummary.js`)
5. upload the HTML report as an artifact (30 days)
6. publish the report to GitHub Pages (only on `main`, and also when tests fail - a failing report is the one
   worth reading)

---

## Assumptions

1. **The mock does not persist writes.** `POST` returns `201` with `id: 101` every time and nothing is stored, so
   the "verify it was stored (simulated)" bonus is covered by (a) asserting the response echoes the sent payload
   plus a server-assigned id, and (b) asserting the follow-up `GET` returns the mock's real `404`. The test is
   commented so the intent is unambiguous: against a real service it should expect `200` with the created quote.
2. **Domain mapping.** `/posts` fields are read as shipping data: `title` is the route, `body` the rate details.
   `userId` is the owning customer.
3. **No authentication.** The API needs no credentials, so none are stored anywhere. With a real service the token
   would come from a repository secret and be read with `cy.env()` (for sensitive values) rather than
   `Cypress.expose()`, which is only used here for the non-sensitive name initial.
4. **Fixture data matches the live dataset** (100 rates, 10 customers, 10 rates each), verified against the live
   API; the "every rate maps to an existing customer" test would catch a change.
5. **Known bugs are asserted as they behave today** (see Findings) so the pipeline reflects reality and stays green.
   When a bug is fixed its test fails, which is the signal to flip it to the correct expectation.

## Findings

JSONPlaceholder is a deliberately simple mock, so these are limitations of the fake backend rather than defects in
a product. They are listed because a real GSRI backend must not behave this way, and because they show what the
suite would catch. BUG-01 came from exploratory testing around requirement 4 (which only asks for a negative GET);
the rest sit on the `POST` path covered by requirement 2. Each has a matching test named `KNOWN BUG <id>` in
`negativeTesting.cy.ts`.

| ID | Request | Expected | Actual | Severity |
| --- | --- | --- | --- | --- |
| **BUG-01** | `PUT /posts/99999` (non-existent rate) | `404 Not Found`, JSON body | `500` with `Content-Type: text/html` and a **Node.js stack trace** exposing internal paths (`/app/node_modules/json-server/...`) | high - wrong status plus information disclosure (OWASP) |
| **BUG-02** | `POST /posts` with an empty body | `400 Bad Request` | `201 Created` | medium |
| **BUG-03** | `POST /posts` with `userId: "notanumber"`, `title: 123` | `400` / `422` | `201 Created`, invalid data echoed back | medium |
| **BUG-04** | `POST /posts` with `userId: 99999` while `GET /users/99999` is `404` | `400` / `422` - a quote cannot be priced for a customer that does not exist | `201 Created`; the quote is an orphan (`GET /posts?userId=99999` → `[]`) | medium - data integrity |

### Reproducing BUG-01

1. Send `PUT https://jsonplaceholder.typicode.com/posts/99999` with header `Content-Type: application/json`
   and body `{"userId":1,"title":"Ghost rate","body":"does not exist"}`.
2. Observe `500 Internal Server Error`, `Content-Type: text/html`, and a Node.js stack trace in the body.
3. Compare with `GET /posts/99999`, which handles the same missing resource correctly with `404`.

In Postman: new request, method `PUT`, that URL, Body → raw → JSON, then Send.

From a terminal (use `curl.exe` on Windows PowerShell, where `curl` is an alias for `Invoke-WebRequest`):

```bash
curl -i -X PUT -H "Content-Type: application/json" -d "{\"userId\":1,\"title\":\"Ghost rate\",\"body\":\"does not exist\"}" https://jsonplaceholder.typicode.com/posts/99999
```

The same request is asserted automatically by `KNOWN BUG BUG-01` in `cypress/e2e/negativeTesting.cy.ts`.

## Known limitations

- **The suite runs against a live third-party API**, so a network incident or its rate limit can cause a failure.
  No automatic retries are configured on purpose: retries would hide flakiness. Against a real integration I would
  keep this suite for a contract/smoke layer and run the bulk of the tests against a virtualised carrier
  (WireMock/Mockoon or recorded fixtures), which is also faster and cheaper.
- **Schemas are strict** (`additionalProperties: false`), so a new response field fails the contract tests by
  design; that is the intended signal for a contract change.
- **Performance assertions are deliberately absent** - response-time thresholds against a shared public API would
  be flaky rather than informative.

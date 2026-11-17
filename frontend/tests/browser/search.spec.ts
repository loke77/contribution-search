import { test, expect } from "@playwright/test";

type Contribution = {
  id: number;
  title: string;
  owner: string;
  startTime: string;
};

type Results = {
  items: Contribution[];
  total: number;
  page: number;
  page_size: number;
};

const PAGE_SIZE = 8;

// Read directly from FastAPI so expected values do not come
// from the frontend proxy being tested.
const API_URL = (
  process.env.API_URL || "http://127.0.0.1:8000"
).replace(/\/$/, "");

function caption(total: number, query = "") {
  const label = total === 1 ? "contribution" : "contributions";
  const trimmed = query.trim();

  return `${total} ${label}${
    trimmed
      ? ` matching “${trimmed}”`
      : " in your workspace"
  }`;
}

function range(page: number, total: number) {
  if (total === 0) return "Showing 0 contributions";

  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, total);

  return `Showing ${first}–${last} of ${total}`;
}

test(
  "real API search, pagination reset, literal terms, empty state and mobile layout",
  async ({ page, request }) => {
    async function readResults(query = "", pageNumber = 1) {
      const response = await request.get(
        `${API_URL}/api/contributions`,
        {
          params: {
            q: query,
            page: pageNumber,
            page_size: PAGE_SIZE,
          },
        },
      );

      expect(response.ok()).toBeTruthy();
      return (await response.json()) as Results;
    }

    async function checkResults(
      expected: Results,
      query = "",
      pageNumber = 1,
    ) {
      await expect(page.getByRole("status")).toHaveText(
        caption(expected.total, query),
      );

      await expect(
        page.locator(".pagination").getByText(
          range(pageNumber, expected.total),
          { exact: true },
        ),
      ).toBeVisible();

      // Check the actual records and their order, not just the count.
      const expectedIds = expected.items.map(
        (item) => `CON-${String(item.id).padStart(3, "0")}`,
      );

      await expect(
        page.locator("tbody .title-cell small"),
      ).toHaveText(expectedIds);

      await expect(
        page.locator("tbody .title-cell strong"),
      ).toHaveText(expected.items.map((item) => item.title));

      await expect(
        page.getByRole("button", { name: "Previous page" }),
      ).toBeEnabled({ enabled: pageNumber > 1 });

      await expect(
        page.getByRole("button", { name: "Next page" }),
      ).toBeEnabled({
        enabled: pageNumber * PAGE_SIZE < expected.total,
      });
    }

    const initial = await readResults();

    await page.goto("/");
    await checkResults(initial);

    if (initial.total > PAGE_SIZE) {
      const secondPage = await readResults("", 2);

      await page
        .getByRole("button", { name: "Next page" })
        .click();

      await checkResults(secondPage, "", 2);
    }

    const search = page.getByRole("searchbox");

    // These queries can match any number of current records,
    // including zero. Expected values come from the real API.
    for (const query of ["SARAH", "."]) {
      const expected = await readResults(query);

      await search.fill(query);
      await checkResults(expected, query);

      // Search must reset pagination to page 1.
      await expect(
        page.locator(".page-number"),
      ).toHaveText("1");
    }

    // Find a query confirmed to have no matches.
    let emptyQuery = "__playwright_no_match__";
    let emptyResults = await readResults(emptyQuery);

    for (
      let attempt = 0;
      emptyResults.total > 0 && attempt < 10;
      attempt++
    ) {
      emptyQuery += "_x";
      emptyResults = await readResults(emptyQuery);
    }

    expect(emptyResults.total).toBe(0);

    await search.fill(emptyQuery);
    await checkResults(emptyResults, emptyQuery);

    await expect(
      page.getByRole("heading", {
        name: "No contributions found",
      }),
    ).toBeVisible();

    // Scope to the empty state: the search box also has a clear button.
    await page
      .locator(".state")
      .getByRole("button", {
        name: "Clear search",
        exact: true,
      })
      .click();

    await expect(search).toHaveValue("");
    await checkResults(initial);

    await page.setViewportSize({
      width: 375,
      height: 812,
    });

    await expect(search).toBeVisible();

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          window.innerWidth,
      ),
    ).toBe(true);
  },
);

test("request failure and retry", async ({ page, request }) => {
  const response = await request.get(
    `${API_URL}/api/contributions`,
    {
      params: {
        page: 1,
        page_size: PAGE_SIZE,
      },
    },
  );

  expect(response.ok()).toBeTruthy();
  const expected = (await response.json()) as Results;

  // Match the pathname explicitly.
  const endpoint = (url: URL) =>
    url.pathname === "/api/contributions";

  await page.route(endpoint, async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Simulated service failure",
      }),
    });
  });

  await page.goto("/");

  const errorState = page.getByRole("alert").filter({
    hasText: "Something went wrong",
  });

  await expect(errorState).toBeVisible();

  // Restore real API requests before clicking Retry.
  await page.unroute(endpoint);

  await errorState
    .getByRole("button", { name: "Try again" })
    .click();

  await expect(page.getByRole("status")).toHaveText(
    caption(expected.total),
  );

  await expect(errorState).toHaveCount(0);

  await expect(
    page.locator("tbody .title-cell small"),
  ).toHaveText(
    expected.items.map(
      (item) => `CON-${String(item.id).padStart(3, "0")}`,
    ),
  );
});
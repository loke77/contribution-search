import { afterEach, expect, test, vi } from "vitest";
import {
  act,
  cleanup,
  renderHook,
  waitFor,
} from "@testing-library/react";

import {
  useContributions,
  type Results,
} from "../src/features/contributions/useContributions";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function pendingRequest() {
  let resolve!: (response: Response) => void;
  let reject!: (reason: Error) => void;

  const promise = new Promise<Response>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    reject,
    succeed(total: number) {
      resolve({
        ok: true,
        json: async () =>
          ({
            items: [],
            total,
            page: 1,
            page_size: 8,
          }) as Results,
      } as Response);
    },
  };
}

test("older responses and errors cannot replace the latest results", async () => {
  const requests = Array.from(
    { length: 5 },
    pendingRequest,
  );

  const fetchMock = vi.fn();

  for (const request of requests) {
    fetchMock.mockReturnValueOnce(request.promise);
  }

  vi.stubGlobal("fetch", fetchMock);

  const { result, rerender } = renderHook(
    ({ query, page }) => useContributions(query, page, 0),
    {
      initialProps: {
        query: "r",
        page: 1,
      },
    },
  );

  // Simulate typing, replacing, clearing and changing pages.
  rerender({ query: "report", page: 1 });
  rerender({ query: "Sarah", page: 1 });
  rerender({ query: "", page: 1 });
  rerender({ query: "", page: 2 });

  expect(result.current.data).toBeUndefined();

  // The newest request finishes first.
  await act(async () => {
    requests[4].succeed(33);
  });

  await waitFor(() => {
    expect(result.current.data?.total).toBe(33);
  });

  // Older requests finish afterwards, ignoring cancellation.
  await act(async () => {
    requests[3].succeed(90);
    requests[2].reject(new Error("Old request failed"));
    requests[1].succeed(4);
    requests[0].succeed(2);
  });

  expect(result.current.data?.total).toBe(33);
  expect(result.current.error).toBeUndefined();

  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  expect(fetchMock.mock.calls[4][0]).toContain("page=2");
});

test("a failed request shows an error and retry recovers", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          total: 0,
          page: 1,
          page_size: 8,
        }),
      }),
  );

  const { result, rerender } = renderHook(
    ({ retry }) => useContributions("", 1, retry),
    {
      initialProps: {
        retry: 0,
      },
    },
  );

  await waitFor(() => {
    expect(result.current.error).toBeTruthy();
  });

  // The retry counter triggers another request.
  rerender({ retry: 1 });

  await waitFor(() => {
    expect(result.current.data?.total).toBe(0);
  });

  expect(result.current.error).toBeUndefined();
});
"use client";

import { useEffect, useRef, useState } from "react";

export type Contribution = {
  id: number;
  title: string;
  owner: string;
  startTime: string;
};

export type Results = {
  items: Contribution[];
  total: number;
  page: number;
  page_size: number;
};

type State = {
  key: string;
  data?: Results;
  error?: string;
};

export function useContributions(
  query: string,
  page: number,
  retry: number,
) {
  const key = JSON.stringify([query, page, retry]);
  const latest = useRef(0);
  const [state, setState] = useState<State>({ key: "" });

  useEffect(() => {
    const sequence = ++latest.current;
    const controller = new AbortController();
    let active = true;

    setState({ key });

    const params = new URLSearchParams({
      q: query,
      page: String(page),
      page_size: "8",
    });

    fetch(`/api/contributions?${params}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }

        return (await response.json()) as Results;
      })
      .then((data) => {
        if (active && latest.current === sequence) {
          setState({ key, data });
        }
      })
      .catch(() => {
        if (active && latest.current === sequence) {
          setState({
            key,
            error:
              "We couldn’t load contributions. Please try again.",
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [key, query, page]);

  // Hide previous results immediately when the request parameters change.
  return state.key === key ? state : { key };
}
"use client";

import { useState } from "react";
import { useContributions } from "../features/contributions/useContributions";

const date = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));

export default function Home() {
  const [{ query, page }, setSearch] = useState({
    query: "",
    page: 1,
  });
  const [retry, setRetry] = useState(0);
  const { data, error } = useContributions(query, page, retry);

  const loading = !data && !error;
  const pages = data
    ? Math.max(1, Math.ceil(data.total / data.page_size))
    : 1;

  function changeQuery(query: string) {
    setSearch({ query, page: 1 });
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Worklog home">
          <span className="brandmark">
            w<span>•</span>
          </span>
          worklog<span className="brand-dot">.</span>
        </a>

        <div className="workspace">
          <span className="workspace-icon">S</span>
          <div>
            Studio workspace
            <small>Your shared source of progress</small>
          </div>
        </div>

        <p className="nav-label">WORKSPACE</p>

        <nav aria-label="Main navigation">
          <a className="nav-current" href="/" aria-current="page">
            <span aria-hidden="true">▦</span>
            Contributions
            <span className="nav-indicator" />
          </a>
        </nav>

        <div className="sidebar-note">
          <span className="note-icon" aria-hidden="true">
            →
          </span>
          <strong>
            Good work deserves
            <br />
            to be discovered.
          </strong>
          <p>
            One place for the things
            <br />
            your team makes happen.
          </p>
          <div className="note-lines" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>

        <div className="sidebar-footer">
          <span className="workspace-icon small">SW</span>
          <div>
            Studio workspace
            <small>Contribution directory</small>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <span>
            Workspace <span className="slash">/</span>
            <strong>Contributions</strong>
          </span>
          <span className="internal">
            <i /> Internal workspace
          </span>
        </header>

        <div className="content">
          <div className="eyebrow">
            <span /> THE WORK, ALL IN ONE PLACE
          </div>

          <div className="page-heading">
            <div>
              <h1>Contributions</h1>
              <p>
                Explore the ideas, projects, and progress across
                your team.
              </p>
            </div>
            <span className="directory-tag">
              → &nbsp; Work directory
            </span>
          </div>

          <section
            className="intro"
            aria-label="About this directory"
          >
            <div className="intro-symbol" aria-hidden="true">
              ✳
            </div>
            <div>
              <h2>A little visibility. A lot of possibility.</h2>
              <p>
                Find what’s been built, who made it happen, and
                where it all started.
              </p>
            </div>
            <span className="intro-art" aria-hidden="true" />
          </section>

          <section
            className="results-panel"
            aria-label="Contribution search"
          >
            <div className="panel-heading">
              <div>
                <h2>All contributions</h2>
                <p>A shared record of meaningful work.</p>
              </div>
              <span className="sort-label">
                ↕ &nbsp; Oldest first
              </span>
            </div>

            <div className="search-row">
              <div className="search-box">
                <span aria-hidden="true">⌕</span>
                <label className="sr-only" htmlFor="search">
                  Search by title or owner
                </label>
                <input
                  id="search"
                  type="search"
                  placeholder="Search by title or owner…"
                  value={query}
                  onChange={(event) =>
                    changeQuery(event.target.value)
                  }
                  autoComplete="off"
                />
                {query && (
                  <button
                    className="clear"
                    onClick={() => changeQuery("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="search-tip">
                Find your next connection.
              </span>
            </div>

            <div
              className="result-caption"
              role="status"
              aria-live="polite"
            >
              {loading
                ? "Finding contributions…"
                : error
                  ? "Request unsuccessful"
                  : `${data?.total} contribution${
                      data?.total === 1 ? "" : "s"
                    }${
                      query.trim()
                        ? ` matching “${query.trim()}”`
                        : " in your workspace"
                    }`}
            </div>

            <div aria-busy={loading} className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">CONTRIBUTION</th>
                    <th scope="col">OWNER</th>
                    <th scope="col">
                      START DATE <span aria-hidden="true">↑</span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data?.items.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="title-cell">
                          <span
                            className={`document-icon color-${
                              row.id % 4
                            }`}
                            aria-hidden="true"
                          >
                            ▤
                          </span>
                          <div>
                            <strong>{row.title}</strong>
                            <small>
                              CON-
                              {String(row.id).padStart(3, "0")}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner">
                          <span
                            className={`avatar color-${
                              row.owner.length % 4
                            }`}
                            aria-hidden="true"
                          >
                            {row.owner
                              .split(" ")
                              .map((name) => name[0])
                              .join("")}
                          </span>
                          {row.owner}
                        </span>
                      </td>
                      <td className="date">
                        {date(row.startTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {loading && (
                <div className="state">
                  <span
                    className="spinner"
                    aria-hidden="true"
                  />
                  <h3>Loading contributions</h3>
                  <p>Bringing the team’s work together.</p>
                </div>
              )}

              {error && (
                <div className="state" role="alert">
                  <h3>Something went wrong</h3>
                  <p>{error}</p>
                  <button
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    Try again
                  </button>
                </div>
              )}

              {data?.total === 0 && (
                <div className="state">
                  <span
                    className="empty-icon"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>
                  <h3>No contributions found</h3>
                  <p>
                    Try another title or owner, or clear your
                    search.
                  </p>
                  <button onClick={() => changeQuery("")}>
                    Clear search
                  </button>
                </div>
              )}
            </div>

            <footer className="pagination">
              <span>
                {data && data.total > 0
                  ? `Showing ${(page - 1) * 8 + 1}–${Math.min(
                      page * 8,
                      data.total,
                    )} of ${data.total}`
                  : "Showing 0 contributions"}
              </span>

              <div>
                <button
                  aria-label="Previous page"
                  disabled={page === 1}
                  onClick={() =>
                    setSearch((state) => ({
                      ...state,
                      page: state.page - 1,
                    }))
                  }
                >
                  ← <span>Previous</span>
                </button>

                <span className="page-number">{page}</span>
                <span className="page-total">
                  of {data ? pages : "…"}
                </span>

                <button
                  aria-label="Next page"
                  disabled={!data || page >= pages}
                  onClick={() =>
                    setSearch((state) => ({
                      ...state,
                      page: state.page + 1,
                    }))
                  }
                >
                  <span>Next</span> →
                </button>
              </div>
            </footer>
          </section>

          <footer className="page-footer">
            <span>
              <i /> A little more connected, one contribution at a
              time.
            </span>
            <span>Made for meaningful work.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
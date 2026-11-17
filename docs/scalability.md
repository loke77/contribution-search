# Scaling Contribution Search

## Baseline

FastAPI loads the bundled 33-row JSON once at startup. Every search then scans all rows, case-folds the searchable fields, sorts matches by `(startTime, id)`, and slices the requested page. The scan grows with the dataset and the sort can take O(m log m) for m matches. `page_size` caps the response payload. The same scan and sort can occur for every keystroke and every page, including a deep page that returns no items.

The Next.js browser hook aborts obsolete client requests and ignores stale results. Work already started upstream can still finish, so use search-as-you-type traffic in load tests. Measure FastAPI directly and through the Next.js API rewrite to distinguish search cost from proxy and network cost.

A local Python 3.12 microbenchmark called the original handler directly, with page 1 and the default page size, for seven timed runs per query after a warm-up. The larger inputs repeat the bundled titles, owners, and dates with unique IDs and shuffled ordering.

| Rows | Empty query | `report` | No matches |
|---:|---:|---:|---:|
| 33 | 0.17 ms | 0.02 ms | 0.01 ms |
| 3,300 | 49.91 ms | 5.58 ms | 3.25 ms |
| 33,000 | 878.96 ms | 68.21 ms | 32.44 ms |

These medians describe the local synthetic run. Test with representative data ordering and date distribution because both affect sorting cost. Measure end-to-end latency and throughput in staging before choosing instance sizes.

## First deployment

Start with one production Next.js process and one FastAPI process. Put a managed HTTPS load balancer or reverse proxy in front and keep FastAPI reachable only from the services that need it. Set connection limits and timeouts at the edge. Serve versioned Next.js assets with their existing cache headers. If the API rewrite becomes a measured bottleneck, route the same public `/api/*` path from the edge to the private FastAPI service and verify parity for query strings, status codes, and response headers. [Next.js self-hosting guide](https://nextjs.org/docs/app/guides/self-hosting)

Use k6 in staging. Record request rate, p50/p95/p99 latency, HTTP errors, CPU, and memory separately for each service. Exercise the empty query, common and uncommon terms, punctuation, pagination, and realistic bursts from people typing. Try both the bundled dataset and an anonymized or synthetic dataset of the size expected in production. Compare a steady run and a ramp. Choose pass thresholds from the product's latency and reliability targets, and use the highest passing sustained request rate to size the deployment. [k6 thresholds](https://grafana.com/docs/k6/latest/using-k6/thresholds/)

## Scale by observed bottleneck

| Signal | Next step |
|---|---|
| FastAPI spends most of its CPU scanning or sorting the same static snapshot | Pre-sort at startup, precompute case-folded title and owner keys, and scan in that order. Count every match to preserve the exact `total`, and retain only the requested page. Add a parity check for order, mixed case, punctuation, and empty results before comparing load tests. |
| FastAPI CPU is saturated after reducing per-request work | Test a second Uvicorn worker on a multi-core host or a second API replica behind the load balancer. Each process loads its own copy of the data. Size for total memory and make sure every replica serves the same dataset version during releases. [FastAPI deployment concepts](https://fastapi.tiangolo.com/deployment/concepts/) |
| Typing bursts dominate request volume | Measure a short input debounce while keeping the existing abort and stale-response handling. Only cache API responses if repeated requests show a useful hit rate. Use a bounded cache keyed by normalized query, page, page size, and dataset version. If results become access-controlled, account for that scope before sharing any cache entries. |
| Data needs independent updates, or larger snapshots exceed memory or latency targets | Move contributions to PostgreSQL. Use a B-tree on `(start_time, id)` for stable ordering and evaluate trigram indexes on case-folded title and owner columns. Use the same normalization as Python and escape SQL wildcard characters so `%` and `_` stay literal. Short or punctuation-only queries may lack usable trigrams, so benchmark those explicitly. Keep exact count and page results on one consistent snapshot. [PostgreSQL trigram indexes](https://www.postgresql.org/docs/current/pgtrgm.html) |
| Deep database offsets are a measured bottleneck | Add cursor pagination based on `(start_time, id)` as an opt-in API contract. Keep existing numbered pages for callers that need random access. Benchmark the exact-count query separately because cursor pagination does not make counting matches cheaper. [PostgreSQL LIMIT and OFFSET](https://www.postgresql.org/docs/current/queries-limit.html) |


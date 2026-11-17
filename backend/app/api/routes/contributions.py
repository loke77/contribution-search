import json
from pathlib import Path
from typing import Annotated
from urllib.parse import urlencode

from fastapi import APIRouter, Query, Response

from ...schemas.contributions import Contribution, Results


router = APIRouter(prefix="/api")


CONTRIBUTIONS = [
    Contribution.model_validate(row)
    for row in json.loads(
        (Path(__file__).resolve().parents[2] / "data" / "contributions.json").read_text()
    )
]


@router.get(
    "/contributions",
    response_model=Results,
    tags=["Contributions"],
    summary="List contributions",
    description=(
        "Search titles and owners by literal substring, ignoring case. "
        "Results are ordered by start time and then ID."
    ),
    responses={
        200: {
            "description": "A page of results, including an empty page when applicable.",
            "headers": {
                "Link": {
                    "description": (
                        "Pagination links to first, last, previous, and next pages "
                        "when applicable. Omitted when there are no matches."
                    ),
                    "schema": {"type": "string"},
                },
            },
        },
    },
)
def contributions(
    response: Response,
    q: Annotated[str, Query(description="Literal title or owner search text.")] = "",
    page: Annotated[int, Query(ge=1, description="One-based page number.")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Results per page.")] = 8,
) -> Results:
    search_text = q.strip()
    query = search_text.casefold()

    matches = sorted(
        (
            row
            for row in CONTRIBUTIONS
            if query in row.title.casefold()
            or query in row.owner.casefold()
        ),
        key=lambda row: (row.startTime, row.id),
    )

    total = len(matches)
    if total:
        last_page = (total + page_size - 1) // page_size
        page_links = [("first", 1), ("last", last_page)]
        if page > 1:
            page_links.append(("prev", min(page - 1, last_page)))
        if page < last_page:
            page_links.append(("next", page + 1))

        # Relative references preserve the public path when served through a proxy.
        links = []
        for relation, number in page_links:
            params = urlencode({"q": search_text, "page": number, "page_size": page_size})
            links.append(f'<?{params}>; rel="{relation}"')
        response.headers["Link"] = ", ".join(links)

    offset = (page - 1) * page_size
    return Results(
        items=matches[offset:offset + page_size],
        total=total,
        page=page,
        page_size=page_size,
    )

from datetime import datetime, timezone

from fastapi.testclient import TestClient
import pytest

from backend.app.api.routes import contributions
from backend.app.main import app


client = TestClient(app)


@pytest.mark.parametrize(
    "query",
    ["report", "SARAH", ".", "[", "]", "*", "+", "?", "C++", ","],
)
def test_literal_search(query):
    response = client.get(
        "/api/contributions",
        params={"q": query, "page_size": 100},
    )
    assert response.status_code == 200
    result = response.json()

    expected = [
        row
        for row in contributions.CONTRIBUTIONS
        if query.casefold() in row.title.casefold()
        or query.casefold() in row.owner.casefold()
    ]

    assert result["total"] == len(expected)
    assert {row["id"] for row in result["items"]} == {
        row.id for row in expected
    }


@pytest.mark.parametrize(
    "params",
    [
        {"page": 0},
        {"page": -1},
        {"page": "x"},
        {"page": 1.5},
        {"page_size": 0},
        {"page_size": 101},
        {"page_size": "x"},
    ],
)
def test_invalid_pagination(params):
    assert client.get(
        "/api/contributions", params=params
    ).status_code == 422


def test_total_pages_and_whitespace():
    first = client.get(
        "/api/contributions",
        params={"q": "  ", "page_size": 3},
    ).json()

    second = client.get(
        "/api/contributions",
        params={"page": 2, "page_size": 3},
    ).json()

    assert first["total"] == second["total"] == len(contributions.CONTRIBUTIONS)
    assert len(first["items"]) == len(second["items"]) == 3
    assert not (
        {row["id"] for row in first["items"]}
        & {row["id"] for row in second["items"]}
    )

    assert client.get(
        "/api/contributions", params={"page": 999}
    ).json()["items"] == []

    assert client.get(
        "/api/contributions", params={"q": "unfindable"}
    ).json()["total"] == 0


def test_sort_before_pagination(monkeypatch):
    def row(id, day):
        return contributions.Contribution(
            id=id,
            title="test",
            owner="Owner",
            startTime=datetime(
                2024, 1, day, tzinfo=timezone.utc
            ),
        )

    monkeypatch.setattr(
        contributions,
        "CONTRIBUTIONS",
        [row(5, 2), row(3, 1), row(1, 1), row(2, 2)],
    )

    result = client.get(
        "/api/contributions",
        params={"page": 2, "page_size": 2},
    ).json()

    assert [row["id"] for row in result["items"]] == [2, 5]
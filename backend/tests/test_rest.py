from urllib.parse import urljoin

from fastapi.testclient import TestClient

from backend.app.main import app


client = TestClient(app)


def test_link_navigation_preserves_search_and_page_size():
    response = client.get("/api/contributions", params={"q": " C++ ", "page_size": 1})
    assert response.status_code == 200
    assert response.json()["total"] > 0

    target = response.links["first"]["url"]
    assert target == "?q=C%2B%2B&page=1&page_size=1"
    linked = client.get(urljoin(str(response.url), target))
    assert linked.json() == response.json()


def test_links_at_page_boundaries():
    first = client.get("/api/contributions", params={"page_size": 3})
    assert set(first.links) == {"first", "next", "last"}

    second = client.get(urljoin(str(first.url), first.links["next"]["url"]))
    assert second.json()["page"] == 2
    assert set(second.links) == {"first", "prev", "next", "last"}

    last = client.get(urljoin(str(first.url), first.links["last"]["url"]))
    assert set(last.links) == {"first", "prev", "last"}
    assert last.json()["items"]

    beyond = client.get("/api/contributions", params={"page": 999, "page_size": 3})
    assert beyond.json()["items"] == []
    assert beyond.links["prev"]["url"] == last.links["last"]["url"]

    empty = client.get("/api/contributions", params={"q": "unfindable"})
    assert empty.status_code == 200
    assert empty.json()["items"] == []
    assert "Link" not in empty.headers


def test_openapi_describes_pagination_header():
    response = client.get("/openapi.json")
    operation = response.json()["paths"]["/api/contributions"]["get"]
    assert operation["responses"]["200"]["headers"]["Link"]["schema"] == {
        "type": "string"
    }

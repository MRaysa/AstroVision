"""Shared pytest fixtures."""

from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def sample_image_id(client: TestClient) -> str:
    """Open a bundled sample and return its cached image id."""
    response = client.post("/api/samples/starfield/open")
    assert response.status_code == 200, response.text
    return response.json()["id"]

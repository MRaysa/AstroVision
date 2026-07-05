"""API-level tests covering the happy paths and error handling."""

from __future__ import annotations

import io

import numpy as np
import pytest
from astropy.io import fits
from starlette.testclient import TestClient


def _fits_bytes(data: np.ndarray) -> bytes:
    buffer = io.BytesIO()
    fits.PrimaryHDU(data=data.astype(np.float32)).writeto(buffer)
    return buffer.getvalue()


def test_health(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_list_samples(client: TestClient) -> None:
    samples = client.get("/api/samples").json()["samples"]
    assert len(samples) == 5
    assert {s["id"] for s in samples} >= {"horsehead", "m31", "moon", "galaxy", "starfield"}


def test_open_sample_returns_full_payload(client: TestClient) -> None:
    payload = client.post("/api/samples/m31/open").json()
    assert payload["image"].startswith("data:image/png;base64,")
    assert payload["width"] > 0 and payload["height"] > 0
    assert payload["metadata"]["object_name"]
    assert len(payload["metadata"]["header"]) > 0
    assert payload["statistics"]["maximum"] >= payload["statistics"]["minimum"]
    assert len(payload["histogram"]["counts"]) + 1 == len(payload["histogram"]["bins"])


def test_upload_roundtrip(client: TestClient) -> None:
    data = np.random.default_rng(0).normal(1000, 50, size=(64, 64))
    files = {"file": ("test.fits", _fits_bytes(data), "application/octet-stream")}
    payload = client.post("/api/upload", files=files).json()
    assert payload["width"] == 64 and payload["height"] == 64


@pytest.mark.parametrize(
    "operation,params",
    [
        ("brightness", {"value": 0.2}),
        ("contrast", {"value": 1.5}),
        ("gamma", {"value": 2.0}),
        ("normalize", {}),
        ("invert", {}),
        ("gaussian_blur", {"sigma": 2.0}),
        ("median_filter", {"size": 3}),
        ("sharpen", {"value": 1.0}),
        ("sobel", {}),
        ("laplacian", {}),
        ("canny", {"low": 50, "high": 150}),
    ],
)
def test_process_operations(client: TestClient, sample_image_id: str, operation, params) -> None:
    body = {"image_id": sample_image_id, "operations": [{"type": operation, "params": params}]}
    response = client.post("/api/process", json=body)
    assert response.status_code == 200, response.text
    assert response.json()["image"].startswith("data:image/png;base64,")


def test_reset_is_empty_pipeline(client: TestClient, sample_image_id: str) -> None:
    response = client.post("/api/process", json={"image_id": sample_image_id, "operations": []})
    assert response.status_code == 200


def test_star_detection(client: TestClient, sample_image_id: str) -> None:
    response = client.post(
        "/api/star-detection",
        json={"image_id": sample_image_id, "threshold_sigma": 5.0, "fwhm": 3.0},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["count"] > 0
    assert all("x" in s and "y" in s for s in body["stars"])


def test_unsupported_file_rejected(client: TestClient) -> None:
    files = {"file": ("notes.txt", b"hello", "text/plain")}
    assert client.post("/api/upload", files=files).status_code == 415


def test_corrupt_fits_rejected(client: TestClient) -> None:
    files = {"file": ("broken.fits", b"not a real fits", "application/octet-stream")}
    assert client.post("/api/upload", files=files).status_code == 422


def test_unknown_image_id(client: TestClient) -> None:
    response = client.post("/api/process", json={"image_id": "missing", "operations": []})
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "image_not_found"

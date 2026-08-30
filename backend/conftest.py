import pytest
from rest_framework.throttling import SimpleRateThrottle

DISABLED_THROTTLE_RATES = {"auth": None, "embeddings": None}


@pytest.fixture(autouse=True)
def relaxed_throttling(monkeypatch):
    monkeypatch.setattr(
        SimpleRateThrottle, "THROTTLE_RATES", DISABLED_THROTTLE_RATES, raising=False
    )
    SimpleRateThrottle.cache.clear()
    yield
    SimpleRateThrottle.cache.clear()

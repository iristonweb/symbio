import pytest

from app.importers.normalizers import slugify, parse_host_port, extract_external_id
from app.importers.source_policy import is_allowed_url, metadata_only_fields


def test_slugify():
    assert slugify("Hello World!") == "hello-world"


def test_parse_host_port():
    assert parse_host_port("81.25.49.133:2302") == ("81.25.49.133", 2302)


def test_extract_external_id():
    assert extract_external_id("https://wargm.ru/server/77427") == "77427"


def test_is_allowed_url():
    assert is_allowed_url("https://wargm.ru/projects") is True
    assert is_allowed_url("https://evil.com/x") is False


def test_metadata_only_fields():
    assert "name" in metadata_only_fields()
    assert "body" not in metadata_only_fields()

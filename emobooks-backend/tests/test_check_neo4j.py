from dataclasses import replace
from pathlib import Path
from unittest.mock import Mock

import pytest
from neo4j.exceptions import ServiceUnavailable

from emobooks.settings import Settings
from scripts import check_neo4j


@pytest.mark.parametrize("field,name,value", [
    ("neo4j_password", "NEO4J_PASSWORD", ""),
    ("neo4j_username", "NEO4J_USERNAME", "  "),
    ("neo4j_uri", "NEO4J_URI", ""),
])
def test_missing_settings_are_named_without_connecting_or_printing_credentials(monkeypatch, capsys, field, name, value):
    config = Settings("mongodb://unused", "unused", Path("missing"), (), neo4j_password="private-password")
    monkeypatch.setattr(check_neo4j.Settings, "from_env", lambda: replace(config, **{field: value}))
    factory = Mock()
    monkeypatch.setattr(check_neo4j, "Neo4jBookStore", factory)
    assert check_neo4j.main() == 1
    output = capsys.readouterr().err
    assert f"missing or empty {name}" in output
    assert str(check_neo4j.ROOT / ".env") in output
    assert "private-password" not in output
    factory.assert_not_called()


def test_connection_failure_does_not_print_raw_driver_details(monkeypatch, capsys):
    config = Settings("mongodb://unused", "unused", Path("missing"), (), neo4j_password="private-password")
    monkeypatch.setattr(check_neo4j.Settings, "from_env", lambda: config)
    store = Mock()
    store.ping.side_effect = ServiceUnavailable("driver detail containing private-password")
    monkeypatch.setattr(check_neo4j, "Neo4jBookStore", lambda settings: store)
    assert check_neo4j.main() == 1
    output = capsys.readouterr().err
    assert "ServiceUnavailable" in output
    assert "private-password" not in output
    store.close.assert_called_once()

from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.routes.storage import _validate_user_storage_key
from app.services import oauth_service


class DummyUser:
    def __init__(self):
        self.id = uuid4()


def test_oauth_state_is_single_use():
    state = oauth_service.create_oauth_state("google")
    assert oauth_service.pop_oauth_state(state) == {"provider": "google"}
    assert oauth_service.pop_oauth_state(state) is None


def test_storage_key_must_be_user_scoped():
    user = DummyUser()
    _validate_user_storage_key(f"users/{user.id}/avatar.png", user)
    with pytest.raises(HTTPException):
        _validate_user_storage_key("products/unsafe/file.zip", user)
    with pytest.raises(HTTPException):
        _validate_user_storage_key(f"users/{user.id}/../secret.txt", user)

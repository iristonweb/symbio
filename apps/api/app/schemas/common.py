from pydantic import BaseModel
from typing import Any


class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    limit: int
    offset: int

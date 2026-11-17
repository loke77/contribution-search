from datetime import datetime

from pydantic import BaseModel


class Contribution(BaseModel):
    id: int
    title: str
    owner: str
    startTime: datetime


class Results(BaseModel):
    items: list[Contribution]
    total: int
    page: int
    page_size: int

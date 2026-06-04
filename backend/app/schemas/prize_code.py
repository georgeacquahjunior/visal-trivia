from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PrizeCodeRead(BaseModel):
    id: int
    code: str
    is_used: bool
    claimed_by: str | None = None
    claimed_at: datetime | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrizeCodeCreate(BaseModel):
    code: str = Field(min_length=2, max_length=120)


class PrizeCodeClaimRequest(BaseModel):
    player_name: str = Field(min_length=1, max_length=120)

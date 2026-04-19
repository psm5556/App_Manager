from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class AppCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    app_type: Optional[str] = "custom"
    folder: str
    port: int
    start_command: str
    order: Optional[int] = 0
    conda_env: Optional[str] = "base"


class AppUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    app_type: Optional[str] = None
    folder: Optional[str] = None
    port: Optional[int] = None
    start_command: Optional[str] = None
    order: Optional[int] = None
    conda_env: Optional[str] = None


class AppResponse(BaseModel):
    id: str
    name: str
    description: str
    app_type: str
    folder: str
    port: int
    start_command: str
    order: int
    conda_env: str = "base"
    created_at: datetime
    updated_at: datetime
    # runtime fields
    status: str = "stopped"          # running | stopped | error
    pid: Optional[int] = None
    uptime: Optional[int] = None     # seconds

    model_config = {"from_attributes": True}

    @field_validator("conda_env", mode="before")
    @classmethod
    def coerce_conda_env(cls, v: object) -> str:
        return v if v is not None else "base"

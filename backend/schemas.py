from pydantic import BaseModel
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


class AppUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    app_type: Optional[str] = None
    folder: Optional[str] = None
    port: Optional[int] = None
    start_command: Optional[str] = None
    order: Optional[int] = None


class AppResponse(BaseModel):
    id: str
    name: str
    description: str
    app_type: str
    folder: str
    port: int
    start_command: str
    order: int
    created_at: datetime
    updated_at: datetime
    # runtime fields
    status: str = "stopped"          # running | stopped | error
    pid: Optional[int] = None
    uptime: Optional[int] = None     # seconds

    model_config = {"from_attributes": True}

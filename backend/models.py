from sqlalchemy import Column, String, Integer, Text, DateTime, func
from database import Base


class App(Base):
    __tablename__ = "apps"

    id           = Column(String(36), primary_key=True)
    name         = Column(String(200), nullable=False)
    description  = Column(Text, default="")
    app_type     = Column(String(20), default="custom")   # fastapi, dash, custom
    folder       = Column(String(500), nullable=False)
    port         = Column(Integer, nullable=False)
    start_command= Column(Text, nullable=False)
    order        = Column(Integer, default=0)
    conda_env    = Column(String(100), default="base")
    created_at   = Column(DateTime, server_default=func.now())
    updated_at   = Column(DateTime, server_default=func.now())

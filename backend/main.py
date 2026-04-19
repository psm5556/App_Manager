import asyncio
import json
import os
from datetime import datetime
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List

from sqlalchemy import text
from database import Base, SessionLocal, engine
import models
import schemas
from process_manager import ProcessManager

Base.metadata.create_all(bind=engine)

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
LOG_DIR    = os.path.join(BASE_DIR, "logs")
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(title="App Manager", version="1.0.0")
pm  = ProcessManager(log_dir=LOG_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── WebSocket manager ─────────────────────────────────────────────────────────
class WsManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws) if hasattr(self.active, 'discard') else None
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        msg  = json.dumps(data, default=str)
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in self.active:
                self.active.remove(ws)


wsm = WsManager()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def runtime(app_id: str) -> dict:
    running = pm.is_running(app_id)
    return {
        "status": "running" if running else "stopped",
        "pid":    pm.get_pid(app_id),
        "uptime": pm.get_uptime(app_id),
    }


def to_response(obj: models.App) -> schemas.AppResponse:
    d = {c.name: getattr(obj, c.name) for c in obj.__table__.columns}
    d.update(runtime(obj.id))
    return schemas.AppResponse(**d)


# ── Background monitor ────────────────────────────────────────────────────────
async def _monitor():
    """Broadcast status every 3 s so the UI reflects crashed processes."""
    while True:
        await asyncio.sleep(3)
        if not wsm.active:
            continue
        db = SessionLocal()
        try:
            apps = db.query(models.App).all()
            statuses = {a.id: runtime(a.id) for a in apps}
            await wsm.broadcast({"type": "status_poll", "data": statuses})
        finally:
            db.close()


@app.on_event("startup")
async def startup():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE apps ADD COLUMN conda_env VARCHAR(100) DEFAULT 'base'"))
            conn.commit()
        except Exception:
            pass  # column already exists
    asyncio.create_task(_monitor())


# ── WebSocket ─────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await wsm.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        wsm.disconnect(websocket)


# ── Apps CRUD ─────────────────────────────────────────────────────────────────
@app.get("/api/apps", response_model=List[schemas.AppResponse])
def list_apps(db: Session = Depends(get_db)):
    return [to_response(a) for a in
            db.query(models.App).order_by(models.App.order, models.App.created_at).all()]


@app.post("/api/apps", response_model=schemas.AppResponse, status_code=201)
async def create_app(body: schemas.AppCreate, db: Session = Depends(get_db)):
    obj = models.App(id=str(uuid4()), **body.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    await wsm.broadcast({"type": "app_created"})
    return to_response(obj)


@app.put("/api/apps/{app_id}", response_model=schemas.AppResponse)
async def update_app(app_id: str, body: schemas.AppUpdate, db: Session = Depends(get_db)):
    obj = db.query(models.App).filter(models.App.id == app_id).first()
    if not obj:
        raise HTTPException(404, "App not found")
    if pm.is_running(app_id):
        raise HTTPException(400, "실행 중인 앱은 수정할 수 없습니다. 먼저 중지하세요.")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    obj.updated_at = datetime.now()
    db.commit(); db.refresh(obj)
    await wsm.broadcast({"type": "app_updated", "id": app_id})
    return to_response(obj)


@app.delete("/api/apps/{app_id}")
async def delete_app(app_id: str, db: Session = Depends(get_db)):
    obj = db.query(models.App).filter(models.App.id == app_id).first()
    if not obj:
        raise HTTPException(404, "App not found")
    if pm.is_running(app_id):
        pm.stop(app_id)
    db.delete(obj); db.commit()
    await wsm.broadcast({"type": "app_deleted", "id": app_id})
    return {"ok": True}


# ── App control ───────────────────────────────────────────────────────────────
@app.post("/api/apps/{app_id}/start")
async def start_app(app_id: str, db: Session = Depends(get_db)):
    obj = db.query(models.App).filter(models.App.id == app_id).first()
    if not obj:
        raise HTTPException(404, "App not found")
    if pm.is_running(app_id):
        raise HTTPException(400, "이미 실행 중입니다.")
    try:
        pid = pm.start(app_id, obj.start_command, obj.folder, obj.conda_env or "")
    except Exception as e:
        raise HTTPException(500, str(e))
    await wsm.broadcast({"type": "app_started", "id": app_id, "pid": pid})
    return {"ok": True, "pid": pid}


@app.post("/api/apps/{app_id}/stop")
async def stop_app(app_id: str, db: Session = Depends(get_db)):
    obj = db.query(models.App).filter(models.App.id == app_id).first()
    if not obj:
        raise HTTPException(404, "App not found")
    if not pm.is_running(app_id):
        raise HTTPException(400, "실행 중이 아닙니다.")
    pm.stop(app_id)
    await wsm.broadcast({"type": "app_stopped", "id": app_id})
    return {"ok": True}


@app.post("/api/apps/start-all")
async def start_all(db: Session = Depends(get_db)):
    apps    = db.query(models.App).order_by(models.App.order).all()
    results = []
    for a in apps:
        if not pm.is_running(a.id):
            try:
                pid = pm.start(a.id, a.start_command, a.folder, a.conda_env or "")
                results.append({"id": a.id, "name": a.name, "ok": True, "pid": pid})
            except Exception as e:
                results.append({"id": a.id, "name": a.name, "ok": False, "error": str(e)})
    await wsm.broadcast({"type": "bulk_start"})
    return {"results": results}


@app.post("/api/apps/stop-all")
async def stop_all(db: Session = Depends(get_db)):
    apps = db.query(models.App).all()
    for a in apps:
        if pm.is_running(a.id):
            pm.stop(a.id)
    await wsm.broadcast({"type": "bulk_stop"})
    return {"ok": True}


# ── Logs ──────────────────────────────────────────────────────────────────────
@app.get("/api/apps/{app_id}/logs")
def get_logs(app_id: str, lines: int = 150):
    return {"logs": pm.get_logs(app_id, lines)}


# ── Static frontend ───────────────────────────────────────────────────────────
if os.path.isdir(STATIC_DIR):
    _assets = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        index = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return JSONResponse({"detail": "Frontend not built. Run: cd frontend && npm run build"}, status_code=503)

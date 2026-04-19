# Skill: FastAPI + React 프로젝트를 App Manager에 통합하기

새로운 FastAPI + React 프로젝트를 App Manager에서 **단일 포트**로 실행/중지할 수 있도록 설정하는 방법입니다.

---

## 전제 조건

- FastAPI 백엔드가 `backend/` 폴더에 있음
- React(Vite) 프론트엔드가 `frontend/` 폴더에 있음
- 프로젝트 구조:

```
MyProject/
├── backend/
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── src/
    ├── package.json
    └── vite.config.ts
```

---

## Step 1 — `frontend/vite.config.ts` 수정

`build.outDir`을 추가하여 빌드 결과물이 `backend/static/`으로 출력되도록 합니다.  
기존 `server` 설정(dev 모드 프록시)은 **그대로 유지**합니다.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,                          // 개발 시에만 사용 (빌드 시 무시됨)
    proxy: {
      '/api': 'http://localhost:{PORT}', // 백엔드 포트로 변경
      '/ws':  { target: 'ws://localhost:{PORT}', ws: true },
    },
  },
  build: {
    outDir: '../backend/static',         // ← 추가
    emptyOutDir: true,
  },
})
```

> `{PORT}`를 실제 백엔드 포트 번호로 변경하세요.

---

## Step 2 — `backend/main.py` 수정

파일 상단 import에 추가:

```python
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os
```

파일 **맨 끝**에 정적 파일 서빙 코드 추가:

```python
# ── Static frontend ───────────────────────────────────────────────────────────
_BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
_STATIC_DIR = os.path.join(_BASE_DIR, "static")

if os.path.isdir(_STATIC_DIR):
    _assets = os.path.join(_STATIC_DIR, "assets")
    if os.path.isdir(_assets):
        app.mount("/assets", StaticFiles(directory=_assets), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa(full_path: str):
        index = os.path.join(_STATIC_DIR, "index.html")
        if os.path.exists(index):
            return FileResponse(index)
        return JSONResponse({"detail": "Frontend not built."}, status_code=503)
```

> **주의**: 이 코드는 모든 경로를 캐치하므로 반드시 **다른 모든 라우터 아래**에 위치해야 합니다.

---

## Step 3 — `start_app.py` 생성 (Windows / Linux 공용)

프로젝트 루트(`MyProject/`)에 생성:

```python
import subprocess
import sys
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(ROOT, "frontend")
BACKEND_DIR  = os.path.join(ROOT, "backend")

print("[MyProject] Building frontend...")
build = subprocess.run("npm run build", cwd=FRONTEND_DIR, shell=True)
if build.returncode != 0:
    print("[ERROR] Frontend build failed")
    sys.exit(1)

print("[MyProject] Starting backend on http://localhost:{PORT}")
subprocess.run(
    "uvicorn main:app --host 0.0.0.0 --port {PORT}",
    cwd=BACKEND_DIR,
    shell=True,
)
```

> `{PORT}`와 `[MyProject]` 부분을 실제 값으로 변경하세요.

**Windows에서 더블클릭으로 실행하려면** `start_app.bat`도 함께 생성:

```bat
@echo off
cd /d "%~dp0"
python start_app.py
pause
```

---

## Step 4 — 프론트엔드 초기 빌드

App Manager 등록 전에 최초 1회 빌드합니다:

```bat
cd frontend
npm install
npm run build
```

`backend/static/` 폴더가 생성됩니다.

---

## Step 5 — App Manager에 등록

App Manager 대시보드에서 **앱 추가**:

| 항목 | 값 |
|------|-----|
| 앱 이름 | `My Project` |
| 앱 타입 | `FastAPI + React` |
| 폴더 경로 | `C:\...\MyProject` (프로젝트 루트) |
| 포트 | `{PORT}` |
| 시작 명령 | `python start_app.py` |
| Conda 환경 | `base` (또는 해당 환경명) |

---

## 동작 흐름

```
App Manager [실행] 클릭
    │
    ├─ 1. frontend/ npm run build  →  backend/static/ 생성
    └─ 2. uvicorn 시작
              │
              ├─ /api/*   → FastAPI 라우터
              ├─ /ws      → WebSocket
              └─ /*       → backend/static/index.html (React SPA)

App Manager [중지] 클릭
    └─ uvicorn 종료 (프론트엔드도 함께 내려감)
```

접속: `http://localhost:{PORT}`

---

## 개발 시 (App Manager 없이)

프론트엔드 변경 사항을 hot reload로 확인할 때는 두 서버를 각각 실행합니다:

```bat
:: 터미널 1 - 백엔드
cd backend
uvicorn main:app --host 0.0.0.0 --port {PORT} --reload

:: 터미널 2 - 프론트엔드 (hot reload)
cd frontend
npm run dev
```

개발 시 접속: `http://localhost:5173`  
(Vite가 `/api` 요청을 백엔드로 프록시)

---

## 체크리스트

- [ ] `frontend/vite.config.ts` — `build.outDir: '../backend/static'` 추가
- [ ] `backend/main.py` — import 추가 (`FileResponse`, `JSONResponse`, `StaticFiles`, `os`)
- [ ] `backend/main.py` — 정적 파일 서빙 코드 추가 (맨 끝)
- [ ] `start_app.py` — 프로젝트 루트에 생성, `{PORT}` 치환 (Windows/Linux 공용)
- [ ] `start_app.bat` — Windows 더블클릭용 (선택, `python start_app.py` 호출)
- [ ] 초기 빌드 실행 (`cd frontend && npm install && npm run build`)
- [ ] App Manager에 등록 (폴더: 프로젝트 루트, 시작 명령: `python start_app.py`)

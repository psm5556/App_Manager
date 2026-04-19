# App Manager

여러 웹 앱(FastAPI+React, Python Dash, 커스텀 등)을 한 곳에서 실행·중지·모니터링하는 대시보드 앱입니다.

## 주요 기능

- 앱별 실행 / 중지 / 열기 (브라우저 탭)
- 전체 앱 일괄 실행 / 중지
- 실시간 상태 모니터링 (WebSocket, 3초 폴링)
- 실행 중 앱의 PID · Uptime 표시
- 앱별 로그 실시간 조회
- 앱 추가 / 수정 / 삭제 (폴더, 포트, 시작 명령 관리)
- 다크 / 라이트 모드 지원

## 구조

```
App_Manager/
├── backend/
│   ├── main.py             # FastAPI 앱 (API + WebSocket + 정적 파일 서빙)
│   ├── process_manager.py  # 프로세스 실행/중지 (Windows/Linux 공용)
│   ├── models.py           # SQLAlchemy ORM 모델
│   ├── schemas.py          # Pydantic 스키마
│   ├── database.py         # SQLite WAL 설정
│   ├── requirements.txt
│   └── static/             # 빌드된 프론트엔드 (vite build 결과물)
├── frontend/
│   ├── src/
│   │   ├── components/     # Dashboard, AppCard, AppModal, LogModal
│   │   ├── api/            # fetch 래퍼
│   │   ├── hooks/          # useWebSocket
│   │   └── types/          # TypeScript 타입 정의
│   └── vite.config.ts      # /api, /ws → localhost:7000 프록시
└── scripts/
    ├── dev.sh / dev.bat    # 개발 모드 (백엔드 + 프론트엔드 동시 실행)
    ├── build.sh / build.bat
    └── start.sh / start.bat
```

---

## 사전 요구사항

| 항목 | 버전 |
|------|------|
| Python | 3.10 이상 |
| Node.js | 18 이상 |
| npm | 9 이상 |

---

## Windows — 개발/테스트

### 1. 저장소 클론

```bat
git clone https://github.com/psm5556/App_Manager.git
cd App_Manager
```

### 2. 개발 서버 실행 (백엔드 + 프론트엔드 동시)

```bat
scripts\dev.bat
```

- 백엔드 자동 가상환경 생성 + 의존성 설치 후 포트 **7000** 에서 시작
- 프론트엔드 `npm install` 후 포트 **5173** 에서 Vite dev 서버 시작
- 두 개의 `cmd` 창이 열립니다. **개발 중에는 `http://localhost:5173`** 으로 접속

> **수동으로 실행하는 경우**
>
> 터미널 1 (백엔드):
> ```bat
> cd backend
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt
> uvicorn main:app --host 0.0.0.0 --port 7000 --reload
> ```
>
> 터미널 2 (프론트엔드):
> ```bat
> cd frontend
> npm install
> npm run dev
> ```

### 3. 프론트엔드 빌드 (단일 서버로 테스트)

```bat
scripts\build.bat
scripts\start.bat
```

빌드 후 `http://localhost:7000` 에서 백엔드가 정적 파일을 직접 서빙합니다.

### Windows에서 앱 등록 시 주의사항

- **폴더 경로**: 백슬래시(`\`) 또는 슬래시(`/`) 모두 가능
  - 예) `C:/Users/user/my-app` 또는 `C:\Users\user\my-app`
- **시작 명령**: Windows 환경에 맞는 명령 사용
  - FastAPI 앱: `venv\Scripts\uvicorn main:app --port 8000`
  - Dash 앱: `venv\Scripts\python app.py`
  - npm 앱: `npm run start`
- 명령은 내부적으로 `shell=True`로 실행되므로 `&&` 체이닝도 가능

---

## Windows — 프론트엔드만 빌드 후 배포

Linux 서버로 배포 전 Windows에서 빌드:

```bat
scripts\build.bat
```

`backend/static/` 폴더가 생성됩니다. 이 폴더와 `backend/` 전체를 서버에 업로드합니다.

---

## Linux — 개발/테스트

### 1. 저장소 클론

```bash
git clone https://github.com/psm5556/App_Manager.git
cd App_Manager
```

### 2. 개발 서버 실행

```bash
bash scripts/dev.sh
```

- 백엔드: `http://localhost:7000`
- 프론트엔드 (hot reload): `http://localhost:5173`
- `Ctrl+C` 로 두 서버 모두 종료

> **수동으로 실행하는 경우**
>
> 터미널 1 (백엔드):
> ```bash
> cd backend
> python3 -m venv venv
> source venv/bin/activate
> pip install -r requirements.txt
> uvicorn main:app --host 0.0.0.0 --port 7000 --reload
> ```
>
> 터미널 2 (프론트엔드):
> ```bash
> cd frontend
> npm install
> npm run dev
> ```

---

## Linux — 프로덕션 배포

### 방법 1: 스크립트 사용 (간단)

```bash
# 프론트엔드 빌드 (최초 1회 또는 코드 변경 시)
bash scripts/build.sh

# 서버 시작
bash scripts/start.sh
```

### 방법 2: systemd 서비스 등록 (권장)

서버 재시작 후 자동 실행을 원할 경우:

**① 서비스 파일 생성**

```bash
sudo nano /etc/systemd/system/app-manager.service
```

```ini
[Unit]
Description=App Manager
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/path/to/App_Manager/backend
ExecStart=/path/to/App_Manager/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 7000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

**② 서비스 등록 및 시작**

```bash
sudo systemctl daemon-reload
sudo systemctl enable app-manager
sudo systemctl start app-manager

# 상태 확인
sudo systemctl status app-manager

# 로그 확인
sudo journalctl -u app-manager -f
```

### 방법 3: nohup으로 백그라운드 실행

```bash
cd backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 7000 > app-manager.out 2>&1 &
echo $! > app-manager.pid
```

종료:
```bash
kill $(cat backend/app-manager.pid)
```

### 방법 4: Docker (선택)

```dockerfile
# Dockerfile (프로젝트 루트에 생성)
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY backend/static/ static/
EXPOSE 7000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7000"]
```

```bash
# 빌드 (Windows/Linux 공통, Node.js 필요)
bash scripts/build.sh   # 또는 scripts\build.bat

# Docker 이미지 빌드 및 실행
docker build -t app-manager .
docker run -d -p 7000:7000 -v $(pwd)/backend:/app --name app-manager app-manager
```

---

## Linux에서 앱 등록 시 주의사항

- **폴더 경로**: 절대 경로 사용 권장 (예: `/home/user/my-app`)
- **시작 명령**: 가상환경을 활성화하는 방식으로 작성
  - FastAPI 앱: `source venv/bin/activate && uvicorn main:app --port 8000`
  - Dash 앱: `source venv/bin/activate && python app.py`
  - Node 앱: `npm run start`
- 명령은 내부적으로 `bash -c "명령"`으로 실행되므로 `&&` 체이닝, `source` 등 사용 가능
- 프로세스 종료 시 전체 프로세스 그룹이 함께 종료됨 (자식 프로세스 포함)

---

## 앱 추가 방법

1. 대시보드 우상단 **앱 추가** 버튼 클릭
2. 아래 정보 입력:

| 항목 | 설명 | 예시 |
|------|------|------|
| 앱 이름 | 표시 이름 | `Project Manager` |
| 설명 | 선택 사항 | `프로젝트 관리 앱` |
| 앱 타입 | FastAPI / Dash / Custom | `FastAPI` |
| 포트 | 앱이 사용하는 포트 | `8000` |
| 폴더 경로 | 앱의 루트 디렉토리 | `/home/user/project-manager/backend` |
| 시작 명령 | 앱 실행 명령 | `source venv/bin/activate && uvicorn main:app --port 8000` |
| 순서 | 카드 표시 순서 | `1` |

---

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/apps` | 앱 목록 조회 |
| `POST` | `/api/apps` | 앱 등록 |
| `PUT` | `/api/apps/{id}` | 앱 수정 (실행 중 불가) |
| `DELETE` | `/api/apps/{id}` | 앱 삭제 |
| `POST` | `/api/apps/{id}/start` | 앱 시작 |
| `POST` | `/api/apps/{id}/stop` | 앱 중지 |
| `POST` | `/api/apps/start-all` | 전체 시작 |
| `POST` | `/api/apps/stop-all` | 전체 중지 |
| `GET` | `/api/apps/{id}/logs?lines=200` | 로그 조회 |
| `WS` | `/ws` | 실시간 상태 스트림 |

---

## 코드 변경 후 배포 갱신

```bash
git pull

# 백엔드 의존성 변경이 있을 경우
cd backend && source venv/bin/activate && pip install -r requirements.txt

# 프론트엔드 변경이 있을 경우
bash scripts/build.sh

# 서비스 재시작
sudo systemctl restart app-manager
# 또는
bash scripts/start.sh
```

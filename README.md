# App Manager

여러 웹 앱(FastAPI+React, Python Dash, 커스텀 등)을 한 곳에서 실행·중지·모니터링하는 대시보드 앱입니다.

---

## 주요 기능

- 앱별 실행 / 중지 / 열기 (브라우저 탭)
- 전체 앱 일괄 실행 / 중지
- 실시간 상태 모니터링 (WebSocket, 3초 폴링)
- 실행 중 앱의 PID · Uptime 표시
- 앱별 로그 실시간 조회
- 앱 추가 / 수정 / 삭제 (Conda 환경 포함)
- 다크 / 라이트 모드

---

## 구조

```
App_Manager/
├── backend/
│   ├── main.py              # FastAPI (API + WebSocket + 정적 파일 서빙)
│   ├── process_manager.py   # 프로세스 실행/중지 (Windows/Linux 공용)
│   ├── models.py            # SQLAlchemy ORM
│   ├── schemas.py           # Pydantic 스키마
│   ├── database.py          # SQLite WAL 설정
│   ├── requirements.txt
│   └── static/              # 빌드된 프론트엔드
├── frontend/
│   ├── src/
│   │   ├── components/      # Dashboard, AppCard, AppModal, LogModal
│   │   ├── api/             # fetch 래퍼
│   │   ├── hooks/           # useWebSocket
│   │   └── types/           # TypeScript 타입 정의
│   └── vite.config.ts       # /api, /ws → localhost:7000 프록시
└── scripts/
    ├── dev.bat              # 개발 모드 (백엔드 + 프론트엔드 동시)
    ├── build.bat            # 프론트엔드 빌드
    ├── start.bat            # 프로덕션 실행
    ├── _run_backend.bat     # 백엔드 단독 실행 (conda SPDM)
    └── _run_frontend.bat    # 프론트엔드 단독 실행
```

---

## 실행 환경

| 항목 | 값 |
|------|-----|
| Python | conda 환경 `SPDM` (Python 3.11) |
| 백엔드 포트 | `7000` |
| Node.js | 18 이상 |

---

## 개발 모드 실행

```bat
scripts\dev.bat
```

- 백엔드: `http://localhost:7000` (conda SPDM, `--reload`)
- 프론트엔드: `http://localhost:5173` (Vite hot reload)

---

## 프론트엔드 빌드 & 프로덕션 실행

```bat
scripts\build.bat
scripts\start.bat
```

빌드 후 `http://localhost:7000` 에서 백엔드가 정적 파일을 직접 서빙합니다.

---

## 앱 등록 방법

대시보드 우상단 **앱 추가** 버튼 클릭 후 아래 정보 입력:

| 항목 | 설명 | 예시 |
|------|------|------|
| 앱 이름 | 표시 이름 | `Project Manager` |
| 설명 | 선택 사항 | `프로젝트 관리 앱` |
| 앱 타입 | FastAPI+React / Dash / Custom | `FastAPI + React` |
| 포트 | 앱이 사용하는 포트 | `7010` |
| 폴더 경로 | 시작 명령을 실행할 디렉터리 | `C:\Users\psm55\Git\Project_Manager` |
| 시작 명령 | 앱 실행 명령 | `start_app.bat` |
| Conda 환경 | 사용할 conda 환경명 | `base` |
| 순서 | 카드 표시 순서 | `1` |

> **Conda 환경**: 비워두거나 `none` 입력 시 conda 활성화 없이 실행됩니다.

---

## 앱 타입별 등록 예시

### FastAPI + React (단일 포트, 권장)

프로젝트 루트에 `start_app.bat` 생성 후:

| 항목 | 값 |
|------|-----|
| 폴더 경로 | `C:\...\MyProject` (프로젝트 루트) |
| 시작 명령 | `start_app.bat` |
| Conda 환경 | `base` |

→ 자세한 설정 방법: [`skill_fastapi_react.md`](skill_fastapi_react.md)

### Python Dash

| 항목 | 값 |
|------|-----|
| 폴더 경로 | `C:\...\MyDashApp` |
| 시작 명령 | `python app.py` |
| Conda 환경 | `base` (또는 해당 환경명) |

### Custom (임의 명령)

| 항목 | 값 |
|------|-----|
| 폴더 경로 | `C:\...\MyApp` |
| 시작 명령 | `node server.js` |
| Conda 환경 | _(비움)_ |

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

import subprocess
import os
import signal
from datetime import datetime
from typing import Dict, Optional


class ProcessInfo:
    def __init__(self, proc: subprocess.Popen, log_path: str):
        self.proc = proc
        self.log_path = log_path
        self.started_at = datetime.now()
        self.pid = proc.pid
        self._log_file = proc.stdout   # stdout/stderr merged into log file


class ProcessManager:
    def __init__(self, log_dir: str):
        self.processes: Dict[str, ProcessInfo] = {}
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)

    # ── start ──────────────────────────────────────────────────────────────────
    def start(self, app_id: str, command: str, cwd: str) -> int:
        if self.is_running(app_id):
            raise RuntimeError("이미 실행 중입니다.")
        if not os.path.isdir(cwd):
            raise RuntimeError(f"폴더가 존재하지 않습니다: {cwd}")

        log_path = os.path.join(self.log_dir, f"{app_id}.log")
        log_file = open(log_path, "a", buffering=1)

        header = (
            f"\n{'='*60}\n"
            f"Started : {datetime.now().isoformat()}\n"
            f"Command : {command}\n"
            f"CWD     : {cwd}\n"
            f"{'='*60}\n\n"
        )
        log_file.write(header)
        log_file.flush()

        try:
            proc = subprocess.Popen(
                ["bash", "-c", command],
                cwd=cwd,
                stdout=log_file,
                stderr=log_file,
                preexec_fn=os.setsid,   # new process group (Linux)
            )
        except Exception as exc:
            log_file.write(f"\n[ERROR] Failed to start: {exc}\n")
            log_file.close()
            raise

        info = ProcessInfo(proc, log_path)
        info._log_file = log_file
        self.processes[app_id] = info
        return proc.pid

    # ── stop ───────────────────────────────────────────────────────────────────
    def stop(self, app_id: str, timeout: int = 10) -> None:
        info = self.processes.get(app_id)
        if not info:
            return
        try:
            pgid = os.getpgid(info.proc.pid)
            os.killpg(pgid, signal.SIGTERM)
            try:
                info.proc.wait(timeout=timeout)
            except subprocess.TimeoutExpired:
                os.killpg(pgid, signal.SIGKILL)
                info.proc.wait()
        except ProcessLookupError:
            pass
        finally:
            self._close(app_id, info)

    def _close(self, app_id: str, info: ProcessInfo) -> None:
        try:
            info._log_file.write(
                f"\nStopped : {datetime.now().isoformat()} "
                f"(exit={info.proc.returncode})\n"
            )
            info._log_file.close()
        except Exception:
            pass
        self.processes.pop(app_id, None)

    # ── status ─────────────────────────────────────────────────────────────────
    def is_running(self, app_id: str) -> bool:
        info = self.processes.get(app_id)
        if not info:
            return False
        if info.proc.poll() is not None:
            self._close(app_id, info)
            return False
        return True

    def get_pid(self, app_id: str) -> Optional[int]:
        return self.processes[app_id].pid if self.is_running(app_id) else None

    def get_uptime(self, app_id: str) -> Optional[int]:
        info = self.processes.get(app_id)
        if info and self.is_running(app_id):
            return int((datetime.now() - info.started_at).total_seconds())
        return None

    # ── logs ───────────────────────────────────────────────────────────────────
    def get_logs(self, app_id: str, lines: int = 100) -> str:
        log_path = os.path.join(self.log_dir, f"{app_id}.log")
        if not os.path.exists(log_path):
            return "(로그 없음)"
        try:
            with open(log_path, "r", errors="replace") as f:
                all_lines = f.readlines()
            return "".join(all_lines[-lines:])
        except Exception as exc:
            return f"(로그 읽기 오류: {exc})"

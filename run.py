import subprocess
import sys
import os
import signal

ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND = os.path.join(ROOT, "frontend")

processes = []


def shutdown(sig=None, frame=None):
    print("\nShutting down...")
    for p in processes:
        try:
            os.killpg(os.getpgid(p.pid), signal.SIGTERM)
        except ProcessLookupError:
            pass
    sys.exit(0)


signal.signal(signal.SIGINT, shutdown)
signal.signal(signal.SIGTERM, shutdown)

# Install frontend dependencies if needed
if not os.path.exists(os.path.join(FRONTEND, "node_modules")):
    print("Installing frontend dependencies...")
    subprocess.run(["npm", "install"], cwd=FRONTEND, check=True)

backend = subprocess.Popen(
    [
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--reload",
        "--reload-dir", "backend",
        "--port", "8000",
    ],
    cwd=ROOT,
    start_new_session=True,
)
processes.append(backend)
print("Backend started on http://localhost:8000")

frontend = subprocess.Popen(
    ["npm", "run", "dev"],
    cwd=FRONTEND,
    start_new_session=True,
)
processes.append(frontend)
print("Frontend started on http://localhost:3000")

for p in processes:
    p.wait()

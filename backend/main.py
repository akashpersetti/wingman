from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid
import json
import os
import boto3
from datetime import datetime, timezone, timedelta

from backend.wingman import Wingman

app = FastAPI(title="Wingman API")

# CORS: allow localhost in dev + any CloudFront origin set via env
_extra_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", *_extra_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Module-level singletons (reused across warm Lambda invocations) ────────────
wingman = Wingman()
wingman.setup()

_dynamodb_table_name = os.getenv("DYNAMODB_TABLE", "wingman-sessions")
_dynamodb = boto3.resource("dynamodb", region_name=os.getenv("AWS_REGION", "us-east-1"))
_table = _dynamodb.Table(_dynamodb_table_name)

SESSION_TTL_DAYS = 30

# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_session(session_id: str) -> List[Dict]:
    """Load history from DynamoDB. Raises 404 if not found."""
    resp = _table.get_item(Key={"session_id": session_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Session not found. Please reinitialise.")
    return json.loads(item["history"])


def _put_session(session_id: str, history: List[Dict]):
    """Write/update session history in DynamoDB."""
    ttl = int((datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)).timestamp())
    _table.put_item(Item={
        "session_id": session_id,
        "history": json.dumps(history),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "ttl": ttl,
    })


# ── Request/Response models ────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    session_id: str
    message: str
    success_criteria: Optional[str] = None


class ChatResponse(BaseModel):
    history: List[Dict[str, str]]


class ResetRequest(BaseModel):
    session_id: str


class ResetResponse(BaseModel):
    session_id: str


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/api/init")
async def init_session():
    session_id = str(uuid.uuid4())
    _put_session(session_id, [])
    return {"session_id": session_id}


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    history = _get_session(request.session_id)
    new_history = await wingman.run_superstep(
        request.message,
        request.success_criteria,
        history,
    )
    _put_session(request.session_id, new_history)
    return {"history": new_history}


@app.post("/api/reset", response_model=ResetResponse)
async def reset(request: ResetRequest):
    new_id = str(uuid.uuid4())
    _put_session(new_id, [])
    # Optionally delete old session (best-effort)
    try:
        _table.delete_item(Key={"session_id": request.session_id})
    except Exception:
        pass
    return {"session_id": new_id}


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ── Lambda entrypoint ──────────────────────────────────────────────────────────
handler = Mangum(app, lifespan="off")

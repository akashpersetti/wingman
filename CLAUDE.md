# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands should be run from the **project root** so that relative paths (`sandbox/`, `memory.db`) resolve correctly.

```bash
# Install Python dependencies
uv sync

# Run FastAPI backend (http://localhost:8000)
uvicorn backend.main:app --reload

# Run Gradio UI (http://localhost:7860)
python gradio_app/app.py

# Run Next.js frontend (http://localhost:3000)
cd frontend && npm install && npm run dev

# Run lab notebooks
jupyter notebook notebooks/1_lab1.ipynb
```

## Project Layout

```
sidekick.py          # Core LangGraph agent
sidekick_tools.py    # Tool definitions
backend/
  main.py            # FastAPI app (REST API)
gradio_app/
  app.py             # Gradio web UI (original interface)
frontend/            # Next.js app router UI
  app/page.tsx       # Main chat page
  components/ChatMessage.tsx
  lib/api.ts         # API client (calls FastAPI)
  lib/types.ts
sandbox/             # File management root dir for the agent
memory.db            # LangGraph SQLite checkpoint store
```

## Architecture

**Sidekick** is a personal AI assistant using a worker-evaluator LangGraph loop.

### Graph Flow

```
START → worker → worker_router
                  ├─ (tool_calls) → tools → worker  [loop]
                  └─ (no tools)   → evaluator → evaluator_router
                                                  ├─ success / needs user → END
                                                  └─ not done            → worker
```

**State fields:** `messages`, `success_criteria`, `feedback_on_work`, `success_criteria_met`, `user_input_needed`

Key behaviors:
- The **worker** uses `gpt-4o-mini` with tools; system prompt includes current datetime and success criteria.
- The **evaluator** uses structured output (`EvaluatorOutput`) to assess success.
- Failed attempts populate `feedback_on_work`, injected into the worker's system prompt on retry.
- Conversation state is checkpointed to `memory.db` (SQLite via `langgraph-checkpoint-sqlite`).
- Playwright browser runs headless=False (visible browser window).

### FastAPI Session Model

`backend/main.py` maintains an in-memory `sessions` dict keyed by `session_id` (UUID). Each session holds a `Sidekick` instance and a `history` list. Endpoints:
- `POST /api/init` → creates session, returns `session_id`
- `POST /api/chat` → `{session_id, message, success_criteria}` → `{history}`
- `POST /api/reset` → tears down old session, creates new one, returns new `session_id`

The Next.js frontend calls FastAPI directly (CORS is configured for `localhost:3000`). Session ID is stored in React state and sent with every request.

### Message Format

History is `List[{role: "user"|"assistant", content: str}]`. Each Sidekick turn appends 3 items: the user message, the assistant reply, and an evaluator feedback message (content starts with `"Evaluator Feedback on this answer:"`).

### Environment Variables

Required in `.env` at the project root:
- `OPENAI_API_KEY`
- `SERPER_API_KEY` (web search)
- `PUSHOVER_TOKEN` / `PUSHOVER_USER` (push notifications)

For the Next.js frontend, optionally create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Dependency Management

Uses `uv` with `pyproject.toml`. Python 3.12+ required.

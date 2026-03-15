# Wingman

A personal AI co-worker that autonomously works through tasks using a worker-evaluator feedback loop built on LangGraph. Wingman keeps working until it meets your success criteria, asking for clarification only when genuinely stuck.

---

## How the Agent Works

### Worker-Evaluator Loop

Wingman uses a two-model LangGraph graph where a **worker** and an **evaluator** check each other in a loop until the task is complete.

```
START
  │
  ▼
worker ──── (has tool calls?) ──── YES ──► tools ─────┐
  │                                                    │
  NO                                                   │
  │◄───────────────────────────────────────────────────┘
  ▼
evaluator
  │
  ├── success_criteria_met = true  ──► END
  ├── user_input_needed = true     ──► END
  ├── turn_count >= MAX_TURNS      ──► END
  └── not done yet                 ──► worker (retry with feedback)
```

**Worker** — a `gpt-4o-mini` instance bound with all tools. On each turn it receives:
- The full conversation history reconstructed from the session
- The success criteria
- Feedback from the previous evaluator turn (if any) injected into the system prompt

The worker either calls tools to gather information, or replies with a final answer. If it has a question for the user it signals this explicitly (`Question: ...`).

**Evaluator** — a second `gpt-4o-mini` instance with structured output (`EvaluatorOutput`). It reads the entire conversation and the worker's last response and returns:

| Field | Type | Meaning |
|---|---|---|
| `feedback` | string | Explanation of what is missing or why it passed |
| `success_criteria_met` | bool | Whether the worker's response satisfies the criteria |
| `user_input_needed` | bool | Whether the worker is blocked waiting for the user |

If both `success_criteria_met` and `user_input_needed` are false, the evaluator's feedback is injected back into the worker's system prompt and the loop continues — up to `MAX_TURNS = 5`.

### Stateless Design

Each API request reconstructs the full LangGraph state from the conversation history stored in DynamoDB. There is no persistent graph checkpointer — `MemorySaver` is ephemeral and scoped to a single invocation. This makes the agent fully compatible with Lambda's stateless execution model.

### Tools

| Tool | Description |
|---|---|
| Web search | Serper API — searches the internet |
| Wikipedia | Full Wikipedia article lookup |
| Python REPL | Executes arbitrary Python code, reads stdout |
| File management | Read, write, list, move files in the `sandbox/` directory |
| Push notification | Sends a Pushover notification to your phone |

### State Fields

```python
class State(TypedDict):
    messages:             List[Any]       # full conversation + tool calls
    success_criteria:     str             # what "done" looks like
    feedback_on_work:     Optional[str]   # evaluator's last rejection reason
    success_criteria_met: bool
    user_input_needed:    bool
    turn_count:           int
```

---

## Deployment Architecture

### Overview

```
User
 │
 │  HTTPS
 ▼
CloudFront  ──── /* ───────────────► S3
            │                    (Next.js static export)
            │
            └──── /api/* ────────► API Gateway v2 (HTTP API)
                                          │
                                          │  AWS_PROXY
                                          ▼
                                     Lambda Function
                                   (FastAPI + Mangum)
                                          │
                                          ▼
                                      DynamoDB
                                   (session store)
```

### Components

**CloudFront** — single distribution serving both frontend and backend. All traffic is HTTPS. The `/api/*` behaviour forwards requests to API Gateway; everything else serves from S3. No certificate management needed — CloudFront provides TLS automatically.

**S3** — stores the Next.js static export (`next build` with `output: 'export'`). Only accessible via CloudFront through Origin Access Control — no public bucket access.

**API Gateway v2 (HTTP API)** — routes all `/api/*` requests to Lambda via `AWS_PROXY` integration. Lower latency and cost than REST API v1.

> API Gateway has a hard **29-second timeout**. For long-running agent tasks, use the Lambda Function URL directly (available as a Terraform output) which supports up to 15 minutes.

**Lambda** — runs the FastAPI application wrapped in Mangum. Packaged as a Docker container image stored in ECR. Configuration:
- Memory: 1024 MB
- Timeout: 300 seconds (5 minutes)
- Workers: 1 (state is reconstructed from DynamoDB per request)

The `Wingman` instance is initialised at **module level** and reused across warm invocations, avoiding repeated LLM client setup on every request.

**DynamoDB** — on-demand table storing session history. Each item:

```
session_id  (PK, String)
history     (String — JSON-serialised message list)
updated_at  (String — ISO timestamp)
ttl         (Number — Unix timestamp, auto-expires after 30 days)
```

**ECR** — private container registry storing Lambda Docker images. Lifecycle policy retains the last 5 images to control storage costs.

### Infrastructure as Code

All AWS resources are managed with Terraform. State is stored remotely in S3.

```
terraform/
├── main.tf          # Provider config, S3 state backend
├── variables.tf     # Input variables
├── outputs.tf       # CloudFront URL, Lambda name, ECR URL, etc.
├── ecr.tf           # Container registry
├── lambda.tf        # Lambda function + function URL
├── apigateway.tf    # API Gateway v2
├── dynamodb.tf      # Sessions table
├── s3.tf            # Frontend bucket + Origin Access Control
├── cloudfront.tf    # Distribution with S3 + API Gateway origins
└── iam.tf           # Lambda execution role + GitHub Actions OIDC role
```

### CI/CD

GitHub Actions deploys on every push to `main` using **OIDC** — no long-lived AWS credentials stored as secrets.

```
push to main
     │
     ├── deploy-backend
     │     ├── docker build --platform linux/amd64 --provenance=false
     │     ├── docker push → ECR
     │     ├── aws lambda update-function-code
     │     ├── aws lambda wait function-updated
     │     └── aws lambda update-function-configuration  (inject API keys)
     │
     └── deploy-frontend  (runs after backend)
           ├── npm ci && npm run build  (NEXT_PUBLIC_API_URL="")
           ├── aws s3 sync → S3
           └── aws cloudfront create-invalidation
```

API keys (`OPENAI_API_KEY`, `SERPER_API_KEY`, etc.) are stored as GitHub repository secrets and injected into the Lambda environment on every deploy. They are never stored in Terraform state or committed to the repository.

### Cost

All components stay within the AWS free tier for personal use:

| Service | Free Tier | Typical Personal Usage |
|---|---|---|
| Lambda | 1M requests + 400K GB-sec/month | < 10K requests/month |
| API Gateway v2 | 1M requests/month | < 10K requests/month |
| DynamoDB | 25 GB + 25 capacity units | < 1 MB |
| S3 | 5 GB storage | < 10 MB |
| CloudFront | 1 TB transfer/month | < 1 GB |
| ECR | 500 MB/month | ~500 MB |
| **Total** | | **~$0–1/month** |

---

## Project Structure

```
sidekick/
├── backend/
│   ├── main.py            # FastAPI app — session endpoints, Mangum handler
│   ├── wingman.py         # LangGraph agent (worker-evaluator loop)
│   └── wingman_tools.py   # Tool definitions
├── frontend/
│   ├── app/
│   │   ├── page.tsx       # Main page — state, handlers, command palette
│   │   ├── layout.tsx
│   │   └── globals.css    # Terminal theme, ai-prose styles
│   ├── components/
│   │   ├── AppHeader.tsx
│   │   ├── AgentPanel.tsx       # ASCII graph diagram + evaluator output
│   │   ├── ChatPanel.tsx        # Message list + input area
│   │   ├── ChatMessage.tsx      # Message renderer (markdown + tables)
│   │   ├── CommandPalette.tsx   # ⌘K palette with fuzzy search
│   │   ├── LoadSessionModal.tsx
│   │   ├── BlockCursorTextarea.tsx
│   │   ├── GraphDiagram.tsx     # Animated ASCII agent graph
│   │   └── ui/splash-screen.tsx
│   └── lib/
│       ├── api.ts         # FastAPI client
│       ├── theme.ts       # Color tokens, MONO, SPIN frames
│       └── types.ts
├── terraform/             # All AWS infrastructure
├── scripts/
│   ├── deploy.sh          # Manual deploy script
│   └── setup-state-bucket.sh
├── .github/workflows/
│   └── deploy.yml         # CI/CD pipeline
├── Dockerfile             # Lambda container image
├── docker-compose.yml     # Local dev (DynamoDB Local + backend + frontend)
└── pyproject.toml         # Python dependencies (uv)
```

---

## Frontend

A terminal-themed chat interface built with Next.js 14 (App Router, static export).

- Split layout: agent panel (ASCII graph + evaluator output) on the left, chat on the right
- Block non-blinking cursor using mirror-div technique (`caret-color: transparent`)
- Command palette (`⌘K` / `Ctrl+K`) with fuzzy search covering all app actions
- Right-aligned user messages, left-aligned AI responses with markdown and table rendering
- `HH:MM:SS` timestamp on every message
- Session persistence — copy session ID and paste it later to resume a conversation
- Success criteria input — describe what "done" looks like before sending a message

---

## Local Development

```bash
# Option A: docker-compose (DynamoDB Local + backend + frontend)
docker-compose up

# Option B: native
uv sync --group local
uvicorn backend.main:app --reload      # backend at :8000
cd frontend && npm run dev             # frontend at :3000
```

Requires `.env` at the project root:

```
OPENAI_API_KEY=...
SERPER_API_KEY=...
PUSHOVER_TOKEN=...   # optional
PUSHOVER_USER=...    # optional
```

---

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `OPENAI_API_KEY` | Lambda / `.env` | OpenAI API key |
| `SERPER_API_KEY` | Lambda / `.env` | Serper web search API key |
| `PUSHOVER_TOKEN` | Lambda / `.env` | Pushover app token (optional) |
| `PUSHOVER_USER` | Lambda / `.env` | Pushover user key (optional) |
| `DYNAMODB_TABLE` | Lambda (Terraform) | DynamoDB table name |
| `CORS_ORIGINS` | Lambda (Terraform) | Comma-separated allowed origins |
| `NEXT_PUBLIC_API_URL` | Frontend build | API base URL (empty in production) |

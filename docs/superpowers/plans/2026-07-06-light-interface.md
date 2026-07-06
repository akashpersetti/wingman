# Wingman Light Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Wingman's terminal-style dark UI with a readable light interface based on akashpersetti.com, using Inter and native input behavior while preserving application functionality.

**Architecture:** Keep the existing Next.js component and state boundaries. Centralize the portfolio-derived palette and common component styles in `theme.ts` and `globals.css`, simplify the custom textarea to a native forwarded-ref component, and update each UI component to consume the shared semantic tokens. Use Node's built-in test runner for source-level UI contract tests so no new runtime dependency is required.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS 3, Framer Motion, Lucide React, Node test runner

## Global Constraints

- Base background is `#ffffff`; alternate/panel background is `#f7fafa`; card background is `#ffffff`.
- Primary text is `#0f172a`; secondary text is `#475569`; accent is `#0d9488`; accent hover is `#0f766e`; accent soft is `#5eead4`; accent wash is `#0d948814`; surface tint is `#ccfbf1`; border is `#e2e8f0`.
- Use `Inter`, `Inter Fallback`, then sans-serif system fallbacks for application UI. Monospace is limited to semantic Markdown code and preformatted code blocks.
- Preserve backend APIs, sessions, message filtering, commands, animation timing, and the desktop 50/50 workspace.
- Do not add theme switching or dark mode.
- Ignore `AGENTS.md`, `.DS_Store`, build output, dependency directories, caches, virtual environments, logs, and local secret files; do not ignore tracked source or example configuration.
- Keep commit `d3dab74` and push it with the design, plan, and implementation commits to `origin/main`.

---

### Task 1: Repository Hygiene

**Files:**
- Create: `.gitignore`

**Interfaces:**
- Consumes: the repository root and existing tracked-file set
- Produces: ignore rules that keep local/tool/build artifacts out of Git without affecting tracked files

- [ ] **Step 1: Add focused ignore rules**

Create `.gitignore` with exactly:

```gitignore
# Local agent context
AGENTS.md
.superpowers/

# macOS
.DS_Store
**/.DS_Store

# Python
__pycache__/
*.py[cod]
.pytest_cache/
.mypy_cache/
.ruff_cache/
.venv/
venv/

# Node / Next.js
node_modules/
.next/
out/
coverage/
*.tsbuildinfo

# Local configuration and secrets
.env
.env.*
!.env.example
!.env.*.example

# Logs and editor files
*.log
.idea/
.vscode/
*.swp
*~

# Terraform local state and generated files (keep .terraform.lock.hcl trackable)
.terraform/
*.tfstate
*.tfstate.*
*.tfplan
crash.log
override.tf
override.tf.json
*_override.tf
*_override.tf.json
```

- [ ] **Step 2: Verify local artifacts are ignored and tracked files remain visible**

Run:

```bash
git check-ignore -v AGENTS.md .DS_Store
git status --short
git ls-files --error-unmatch terraform/terraform.tfvars.example frontend/package-lock.json uv.lock
```

Expected: `AGENTS.md` and `.DS_Store` match `.gitignore`; neither appears in status; all three tracked files are printed successfully.

- [ ] **Step 3: Commit repository hygiene**

```bash
git add .gitignore
git diff --cached --check
git commit -m "chore: ignore local development artifacts"
```

Expected: one new tracked `.gitignore`; no local artifacts staged.

---

### Task 2: Shared Light Theme and Native Textarea

**Files:**
- Create: `frontend/tests/interface-contract.test.mjs`
- Create: `frontend/components/AppTextarea.tsx`
- Modify: `frontend/package.json`
- Modify: `frontend/app/layout.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/lib/theme.ts`
- Modify: `frontend/components/ChatPanel.tsx`
- Delete: `frontend/components/BlockCursorTextarea.tsx`

**Interfaces:**
- Consumes: Next.js `Inter`, existing `T` color consumers, and textarea props used by `ChatPanel`
- Produces: `T` semantic palette, `UI_FONT: React.CSSProperties`, and a default `AppTextarea` forwarding `HTMLTextAreaElement`

- [ ] **Step 1: Add the UI contract test script and failing foundation tests**

Add `"test:interface": "node --test tests/interface-contract.test.mjs"` to `frontend/package.json` scripts. Create `frontend/tests/interface-contract.test.mjs`:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = async path => {
  try {
    return await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
};

test("defines the portfolio light palette and Inter UI stack", async () => {
  const [theme, css, layout] = await Promise.all([
    read("lib/theme.ts"),
    read("app/globals.css"),
    read("app/layout.tsx"),
  ]);

  for (const value of ["#ffffff", "#f7fafa", "#0f172a", "#475569", "#0d9488", "#0f766e", "#5eead4", "#0d948814", "#ccfbf1", "#e2e8f0"]) {
    assert.ok(theme.includes(value), `theme is missing ${value}`);
  }
  assert.match(css, /font-family:\s*var\(--font-inter\),\s*"Inter",\s*"Inter Fallback"/);
  assert.match(layout, /variable:\s*"--font-inter"/);
  assert.doesNotMatch(theme, /MONO|Menlo|Monaco|Courier/);
});

test("uses a native forwarded textarea without cursor emulation", async () => {
  const [textarea, chat, css] = await Promise.all([
    read("components/AppTextarea.tsx"),
    read("components/ChatPanel.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(textarea, /forwardRef<HTMLTextAreaElement/);
  assert.match(textarea, /<textarea/);
  assert.match(chat, /AppTextarea/);
  assert.doesNotMatch(`${textarea}\n${chat}\n${css}`, /BlockCursor|block-cursor|caretColor:\s*["']transparent|mirrorRef|updateCursor/);
});
```

- [ ] **Step 2: Run the contract tests and verify RED**

Run: `cd frontend && npm run test:interface`

Expected: FAIL because the palette is dark, `--font-inter` is not configured, and `AppTextarea.tsx` does not exist.

- [ ] **Step 3: Implement the palette and Inter variable**

Change `layout.tsx` to:

```tsx
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
```

Keep `<body className={inter.className}>` but change it to `<body className={inter.variable}>`.

Replace `theme.ts` with:

```ts
import React from "react";

export const T = {
  bg: "#ffffff",
  panel: "#f7fafa",
  surface: "#ffffff",
  surfaceTint: "#ccfbf1",
  border: "#e2e8f0",
  text: "#0f172a",
  muted: "#475569",
  dim: "#64748b",
  accent: "#0d9488",
  accentHover: "#0f766e",
  accentSoft: "#5eead4",
  accentWash: "#0d948814",
  blue: "#0d9488",
  teal: "#0d9488",
  yellow: "#0f766e",
  red: "#be123c",
  orange: "#d97706",
} as const;

export const UI_FONT: React.CSSProperties = {
  fontFamily: 'var(--font-inter), "Inter", "Inter Fallback", ui-sans-serif, system-ui, sans-serif',
};

export const EVALUATOR_PREFIX = "Evaluator Feedback on this answer:";

export function nowHMS(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, "0"))
    .join(":");
}
```

Replace the dark body, block-cursor, scrollbar, prose, and backdrop rules in `globals.css` with the exact palette variables and shared control behavior:

```css
:root {
  --bg-base: #ffffff;
  --bg-alt: #f7fafa;
  --bg-card: #ffffff;
  --surface-tint: #ccfbf1;
  --accent: #0d9488;
  --accent-hover: #0f766e;
  --accent-soft: #5eead4;
  --accent-wash: #0d948814;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border: #e2e8f0;
}

html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: var(--font-inter), "Inter", "Inter Fallback", ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  @apply antialiased;
}
button, input, textarea { font: inherit; }
button, a, input, textarea { border-radius: 8px; }
button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
button:not(:disabled), a { cursor: pointer; }
button:disabled { cursor: not-allowed; }
::selection { background: var(--surface-tint); color: var(--text-primary); }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg-alt); }
::-webkit-scrollbar-thumb { background: #cbd5e1; border: 2px solid var(--bg-alt); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
```

Retain the reduced-motion rule. Replace the prose and backdrop rules with:

```css
.ai-prose { max-width: 100%; color: var(--text-primary); font-size: 0.875rem; line-height: 1.65; }
.ai-prose p { margin: 0 0 0.65rem; }
.ai-prose p:last-child { margin-bottom: 0; }
.ai-prose pre {
  margin: 0.75rem 0;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-alt);
  padding: 0.875rem;
  color: var(--text-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
}
.ai-prose code:not(pre code) {
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg-alt);
  padding: 0.08rem 0.3rem;
  color: var(--accent-hover);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
}
.ai-prose ul { margin: 0.5rem 0; list-style: disc; padding-left: 1.25rem; }
.ai-prose ol { margin: 0.5rem 0; list-style: decimal; padding-left: 1.25rem; }
.ai-prose li { margin: 0.2rem 0; }
.ai-prose h1, .ai-prose h2, .ai-prose h3 { color: var(--accent-hover); font-weight: 700; }
.ai-prose h1 { margin: 1rem 0 0.5rem; font-size: 1.1rem; }
.ai-prose h2 { margin: 0.9rem 0 0.45rem; font-size: 1rem; }
.ai-prose h3 { margin: 0.8rem 0 0.4rem; font-size: 0.9rem; }
.ai-prose a { color: var(--accent-hover); text-decoration: underline; }
.ai-prose blockquote { margin: 0.75rem 0; border-left: 3px solid var(--accent-soft); padding-left: 0.875rem; color: var(--text-secondary); }
.ai-prose strong { color: var(--text-primary); font-weight: 700; }
.ai-prose hr { margin: 1rem 0; border: 0; border-top: 1px solid var(--border); }
.ai-prose table { width: 100%; margin: 0.75rem 0; border-collapse: collapse; font-size: 0.82rem; }
.ai-prose th, .ai-prose td { border-bottom: 1px solid var(--border); padding: 0.45rem 0.6rem; text-align: left; }
.ai-prose th { color: var(--accent-hover); font-weight: 700; }
.cmd-backdrop { position: fixed; inset: 0; z-index: 60; background: rgba(15, 23, 42, 0.32); backdrop-filter: blur(4px); }
```

- [ ] **Step 4: Replace block-cursor emulation with a native textarea**

Create `AppTextarea.tsx`:

```tsx
"use client";

import { forwardRef } from "react";

interface Props {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  style?: React.CSSProperties;
  ariaLabel?: string;
}

const AppTextarea = forwardRef<HTMLTextAreaElement, Props>(
  ({ value, onChange, onKeyDown, disabled, placeholder, rows = 2, style, ariaLabel }, ref) => (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel}
      style={{
        width: "100%",
        minWidth: 0,
        padding: 0,
        margin: 0,
        border: 0,
        outline: 0,
        resize: "none",
        background: "transparent",
        color: disabled ? "#94a3b8" : "#0f172a",
        fontFamily: "inherit",
        fontSize: "14px",
        lineHeight: 1.55,
        ...style,
      }}
    />
  )
);

AppTextarea.displayName = "AppTextarea";
export default AppTextarea;
```

In `ChatPanel.tsx`, change the import and both JSX elements from `BlockCursorTextarea` to `AppTextarea`, add `ariaLabel="Success criteria"` and `ariaLabel="Message"`, and remove terminal prefix spans beside both fields. Delete `BlockCursorTextarea.tsx`.

- [ ] **Step 5: Run the tests and verify GREEN**

Run: `cd frontend && npm run test:interface`

Expected: 2 tests pass, 0 fail.

- [ ] **Step 6: Verify compilation and commit the shared foundation**

Run:

```bash
cd frontend && npx tsc --noEmit
cd .. && git diff --check
git add frontend/package.json frontend/app/layout.tsx frontend/app/globals.css frontend/lib/theme.ts frontend/components/AppTextarea.tsx frontend/components/ChatPanel.tsx frontend/components/BlockCursorTextarea.tsx frontend/tests/interface-contract.test.mjs
git commit -m "refactor: establish light interface foundation"
```

Expected: TypeScript exits 0; the commit records the native-textarea rename and shared theme foundation.

---

### Task 3: Conventional Application Chrome and Chat

**Files:**
- Modify: `frontend/tests/interface-contract.test.mjs`
- Modify: `frontend/app/page.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/AppHeader.tsx`
- Modify: `frontend/components/ChatMessage.tsx`
- Modify: `frontend/components/ChatPanel.tsx`
- Modify: `frontend/components/LoadSessionModal.tsx`

**Interfaces:**
- Consumes: `T`, `UI_FONT`, `AppTextarea`, existing page handlers and refs
- Produces: responsive `.app-shell`, `.app-header`, `.workspace`, `.agent-panel`, and `.chat-panel` classes plus terminal-free header/chat/modal UI

- [ ] **Step 1: Add failing application-chrome contract tests**

Append:

```js
test("removes terminal chrome from the page, header, chat, and session modal", async () => {
  const source = (await Promise.all([
    read("app/page.tsx"),
    read("components/AppHeader.tsx"),
    read("components/ChatMessage.tsx"),
    read("components/ChatPanel.tsx"),
    read("components/LoadSessionModal.tsx"),
  ])).join("\n");

  assert.doesNotMatch(source, /\bMONO\b|\bSPIN\b|Menlo|Monaco|Courier|\$ wingman|you ❯|send  \[↵\]|\$ load session/);
  assert.match(source, /className="workspace"/);
  assert.match(source, /className="chat-panel"/);
  assert.match(source, /UI_FONT/);
});

test("defines responsive desktop and narrow-screen workspace behavior", async () => {
  const css = await read("app/globals.css");
  assert.match(css, /\.workspace\s*\{/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /flex-direction:\s*column/);
});
```

- [ ] **Step 2: Run the tests and verify RED**

Run: `cd frontend && npm run test:interface`

Expected: the two new tests fail on `MONO`, `SPIN`, shell copy, and missing responsive classes.

- [ ] **Step 3: Remove spinner and root monospace plumbing**

In `page.tsx`, remove `MONO` and `SPIN` imports, `spinIdx`, and the spinner interval effect. Remove `spinIdx` props passed to `AppHeader` and `ChatPanel`. Render the root as:

```tsx
<div className="app-shell" style={UI_FONT}>
  <AppHeader
    sessionId={sessionId}
    isLoading={isLoading}
    copied={copied}
    onCopySession={handleCopySession}
    onOpenPalette={() => setShowPalette(true)}
    onLoadSession={() => setShowLoadSession(true)}
  />
  <div className="workspace">
    <AgentPanel
      isLoading={isLoading}
      evalMessages={evalMessages}
      evalEndRef={evalEndRef}
    />
    <ChatPanel
      isInitializing={isInitializing}
      isLoading={isLoading}
      error={error}
      mainMessages={mainMessages}
      message={message}
      setMessage={setMessage}
      successCriteria={successCriteria}
      setSuccessCriteria={setSuccessCriteria}
      showCriteria={showCriteria}
      setShowCriteria={setShowCriteria}
      inputDisabled={inputDisabled}
      inputRef={inputRef}
      criteriaRef={criteriaRef}
      chatScrollRef={chatScrollRef}
      mainEndRef={mainEndRef}
      onSend={handleSend}
      onReset={handleReset}
    />
  </div>
</div>
```

Import `UI_FONT` from `@/lib/theme`; do not change any handler, ref, session, or message-state wiring.

Add these exact layout rules to `globals.css`:

```css
.app-shell { height: 100vh; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-base); color: var(--text-primary); }
.app-header { min-height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 10px 20px; background: var(--bg-card); border-bottom: 1px solid var(--border); z-index: 20; }
.workspace { flex: 1; min-height: 0; display: flex; overflow: hidden; }
.agent-panel, .chat-panel { width: 50%; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }
.agent-panel { border-right: 1px solid var(--border); }
@media (max-width: 900px) {
  .app-shell { min-height: 100vh; height: auto; overflow: visible; }
  .workspace { flex-direction: column; overflow: visible; }
  .agent-panel, .chat-panel { width: 100%; min-height: 70vh; }
  .agent-panel { border-right: 0; border-bottom: 1px solid var(--border); }
  .app-header { align-items: flex-start; }
}
```

- [ ] **Step 4: Restyle header, chat, and modal using semantic controls**

Apply these exact behavioral and copy changes while preserving handlers:

- `AppHeader`: remove `spinIdx`; use `.app-header`; render `Wingman` with `Personal co-worker`; use `LoaderCircle` with CSS rotation and text `Processing` while loading; label actions `Source`, `Commands`, and `Load session`; use white buttons with `T.border`, `T.text`, 8px radius, and 8px/12px padding; use a teal-tinted session status pill.
- `ChatMessage`: import shared `T` and `EVALUATOR_PREFIX`; remove its local dark palette; render user messages in `T.accentWash` with a `T.accentSoft` border, 12px radius, `T.text`, and inherited font; label metadata `You`. Label assistant metadata `Wingman` in teal and keep Markdown in `.ai-prose`.
- `ChatPanel`: remove `spinIdx`; use `.chat-panel`; replace shell empty state with heading `Wingman is ready` and two sentences describing Enter and Commands; use `LoaderCircle` for `Wingman is working`; use a rose-tinted error card; capitalize `Success criteria`, `Reset`, `Send`, and placeholders; style the composer as a white surface with a top border, 14px text, a teal filled Send button, and a neutral Reset button.
- `LoadSessionModal`: import `T` and `UI_FONT`; use a responsive `width: min(460px, calc(100vw - 32px))`; white surface, 12px radius, slate shadow; heading `Load session`; body `Paste a session ID to reconnect to an existing conversation.`; labels `Cancel` and `Connect`; teal focus and primary action.

Use `aria-label` or visible text for icon-only controls, especially session-copy and modal dismissal controls. Do not change any callback body.

- [ ] **Step 5: Run tests and TypeScript verification**

Run:

```bash
cd frontend && npm run test:interface
npx tsc --noEmit
```

Expected: all 4 contract tests pass; TypeScript exits 0.

- [ ] **Step 6: Commit the chrome and chat redesign**

```bash
cd ..
git diff --check
git add frontend/app/page.tsx frontend/app/globals.css frontend/components/AppHeader.tsx frontend/components/ChatMessage.tsx frontend/components/ChatPanel.tsx frontend/components/LoadSessionModal.tsx frontend/tests/interface-contract.test.mjs
git commit -m "feat: replace terminal chrome with light interface"
```

---

### Task 4: Visual Agent Graph, Evaluator, Splash, and Command Palette

**Files:**
- Modify: `frontend/tests/interface-contract.test.mjs`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/AgentPanel.tsx`
- Modify: `frontend/components/GraphDiagram.tsx`
- Modify: `frontend/components/CommandPalette.tsx`
- Modify: `frontend/components/ui/splash-screen.tsx`

**Interfaces:**
- Consumes: `T`, `UI_FONT`, existing graph loading state, command callbacks, and splash completion callback
- Produces: CSS-node graph retaining active sequence, readable evaluator cards, native-caret command search, and clean progress splash

- [ ] **Step 1: Add failing contracts for remaining terminal surfaces**

Append:

```js
test("renders the graph, splash, evaluator, and palette without terminal artifacts", async () => {
  const [graph, splash, agent, palette] = await Promise.all([
    read("components/GraphDiagram.tsx"),
    read("components/ui/splash-screen.tsx"),
    read("components/AgentPanel.tsx"),
    read("components/CommandPalette.tsx"),
  ]);
  const source = `${graph}\n${splash}\n${agent}\n${palette}`;

  assert.doesNotMatch(source, /Menlo|Monaco|Courier|mirrorRef|cursorLeft|caretColor:\s*["']transparent|BOOT_LINES|█|░|┌|┐|└|┘|__start__|__end__|waiting for evaluator output\.\.\./);
  assert.match(graph, /className="graph-node/);
  assert.match(splash, /role="progressbar"/);
  assert.match(palette, /type="search"/);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `cd frontend && npm run test:interface`

Expected: FAIL on ASCII graph characters, terminal splash, custom palette cursor, and evaluator shell copy.

- [ ] **Step 3: Rebuild the graph as semantic nodes and connectors**

Keep `CYCLE` and the current 800ms active-node effect. Replace the ASCII renderer with reusable local helpers:

```tsx
function Node({ id, label, detail }: { id: string; label: string; detail?: string }) {
  const active = activeNode === id;
  return (
    <div className={`graph-node${active ? " graph-node--active" : ""}`} aria-current={active ? "step" : undefined}>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </div>
  );
}

return (
  <div className="agent-graph" aria-label="Agent workflow">
    <div className="graph-row"><Node id="start" label="Start" /><span className="graph-arrow">→</span><Node id="worker" label="Worker" /><span className="graph-arrow">↔</span><Node id="tools" label="Tools" /></div>
    <span className="graph-arrow graph-arrow--down">↓</span>
    <div className="graph-row"><Node id="evaluator" label="Evaluator" /></div>
    <span className="graph-arrow graph-arrow--down">↓</span>
    <div className="graph-row"><Node id="worker" label="Worker" detail="Retry" /><span className="graph-arrow">or</span><Node id="end" label="End" /></div>
  </div>
);
```

Add CSS for centered flex rows, wrapping at narrow widths, 120px minimum node width, 10px radii, white surfaces, slate borders/text, teal active border/background/shadow, and slate arrow labels. Do not depend on character spacing or monospace fonts.

- [ ] **Step 4: Restyle the agent/evaluator panel**

Use `className="agent-panel"` at the root. Keep its two 50%-height sections. Label them `Agent workflow` and `Evaluator`. Replace the empty line with `Evaluator feedback will appear here after a response.` in `T.muted`. Render each feedback item as a white card with `T.border`, 10px radius, `T.text`, a teal left border, and metadata `Turn N` plus timestamp.

- [ ] **Step 5: Simplify the splash and command palette**

In the splash, remove `BOOT_LINES`, `shown`, filled character math, and terminal transcript. Preserve the stage timing effect. Render:

```tsx
<div className="splash" style={{ opacity: exiting ? 0 : 1 }}>
  <div className="splash__content">
    <div className="splash__mark">W</div>
    <h1>Wingman</h1>
    <p>Preparing your workspace</p>
    <div className="splash__track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
      <div className="splash__fill" style={{ width: `${progress}%` }} />
    </div>
  </div>
</div>
```

Style it with a white background, teal mark/fill, primary heading, secondary copy, soft border, and the existing 350ms opacity transition.

In `CommandPalette`, remove `cursorLeft`, `inputFocused`, `mirrorRef`, and `updateCursor`. Set the input to `type="search"`, normal `caretColor: T.accent`, `aria-label="Search commands"`, and placeholder `Search commands…`. Use `UI_FONT`, responsive `width: min(520px, calc(100vw - 32px))`, white background, 12px radius, slate shadow, teal selected background/border, and labels `Esc to close`, `No commands match`, `Navigate`, `Run`, and `Close`. Preserve filtering, arrow-key selection, Enter execution, Escape handling, mouse selection, and scrolling.

- [ ] **Step 6: Run tests and TypeScript verification**

Run:

```bash
cd frontend && npm run test:interface
npx tsc --noEmit
```

Expected: all 5 contract tests pass; TypeScript exits 0.

- [ ] **Step 7: Commit the remaining visual surfaces**

```bash
cd ..
git diff --check
git add frontend/app/globals.css frontend/components/AgentPanel.tsx frontend/components/GraphDiagram.tsx frontend/components/CommandPalette.tsx frontend/components/ui/splash-screen.tsx frontend/tests/interface-contract.test.mjs
git commit -m "feat: modernize agent workflow surfaces"
```

---

### Task 5: Full Verification and Push

**Files:**
- Modify only if verification reveals a requirement gap: files already listed in Tasks 2–4

**Interfaces:**
- Consumes: the completed light interface and Git history
- Produces: verified build and pushed `origin/main` containing the pre-existing evaluator fix and all interface work

- [ ] **Step 1: Verify every design requirement in source**

Run:

```bash
cd frontend
npm run test:interface
npm run lint
npm run build
cd ..
rg -n "BlockCursor|block-cursor|caretColor: ['\"]transparent|\bMONO\b|\bSPIN\b|Menlo|Monaco|Courier|__start__|__end__|█|░|┌|┐|└|┘" frontend --glob '!package-lock.json' --glob '!tests/**'
```

Expected: tests, lint, and build exit 0. The search returns only `Menlo`/`Monaco` within `.ai-prose` semantic code styling in `globals.css`; no UI component match remains.

- [ ] **Step 2: Inspect the final changes and history**

Run:

```bash
cd frontend
npm run dev
```

With the dev server running, use a second terminal:

```bash
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new --disable-gpu --screenshot=/tmp/wingman-desktop.png --window-size=1440,1000 http://localhost:3000
'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless=new --disable-gpu --screenshot=/tmp/wingman-mobile.png --window-size=390,844 http://localhost:3000
```

Inspect both screenshots. Expected: white and soft-white surfaces, dark navy text, teal accents, Inter UI text, native carets, no terminal blocks or ASCII diagrams, no horizontal clipping at either viewport, and readable controls and status text. Stop the dev server, then run:

```bash
cd ..
git status --short --branch
git diff origin/main...HEAD --check
git diff --stat origin/main...HEAD
git log --oneline --decorate origin/main..HEAD
```

Expected: clean tracked worktree; ignored `AGENTS.md` and `.DS_Store` absent from status; history contains `d3dab74`, the design and plan commits, and implementation commits.

- [ ] **Step 3: Push all local commits**

Run:

```bash
git push origin main
git status --short --branch
```

Expected: push succeeds and `main` is aligned with `origin/main`; no unrelated local artifacts were committed.

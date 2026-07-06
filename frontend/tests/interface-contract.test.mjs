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

test("keeps native input focus outlines visible", async () => {
  const [textarea, palette, css] = await Promise.all([
    read("components/AppTextarea.tsx"),
    read("components/CommandPalette.tsx"),
    read("app/globals.css"),
  ]);

  assert.doesNotMatch(`${textarea}\n${palette}`, /outline\s*:\s*(?:0|["']none["'])/);
  assert.match(css, /input:focus-visible,\s*textarea:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)/s);
});

test("uses the contrast-safe primary color for small filled actions", async () => {
  const [chat, modal, css] = await Promise.all([
    read("components/ChatPanel.tsx"),
    read("components/LoadSessionModal.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(chat, /className="control control--primary"/);
  assert.match(modal, /className="control control--primary"/);
  assert.match(css, /--accent-hover:\s*#0f766e/);
  assert.match(css, /\.control--primary\s*\{[^}]*background:\s*var\(--accent-hover\)/s);
  assert.match(css, /\.control--primary\s*\{[^}]*color:\s*#ffffff/s);
});

test("prevents narrow-screen overflow with global sizing and session truncation", async () => {
  const [header, css] = await Promise.all([
    read("components/AppHeader.tsx"),
    read("app/globals.css"),
  ]);

  assert.match(css, /\*,\s*\*::before,\s*\*::after\s*\{\s*box-sizing:\s*border-box/);
  assert.match(header, /className="session-pill"/);
  assert.match(header, /className="session-pill__id"/);
  assert.match(css, /\.session-pill\s*\{[^}]*max-width:\s*100%[^}]*min-width:\s*0/s);
  assert.match(css, /\.session-pill__id\s*\{[^}]*overflow:\s*hidden[^}]*text-overflow:\s*ellipsis[^}]*white-space:\s*nowrap/s);
});

test("gives both overlays dialog semantics, selected command state, and managed focus", async () => {
  const [palette, modal, focusHook] = await Promise.all([
    read("components/CommandPalette.tsx"),
    read("components/LoadSessionModal.tsx"),
    read("lib/useDialogFocus.ts"),
  ]);

  for (const dialog of [palette, modal]) {
    assert.match(dialog, /role="dialog"/);
    assert.match(dialog, /aria-modal="true"/);
    assert.match(dialog, /useDialogFocus/);
  }
  assert.match(palette, /aria-label="Command palette"/);
  assert.match(palette, /role="listbox"/);
  assert.match(palette, /role="option"/);
  assert.match(palette, /aria-selected=\{i === selected\}/);
  assert.match(palette, /aria-activedescendant=/);
  assert.match(modal, /aria-labelledby="load-session-title"/);
  assert.match(focusHook, /event\.key === "Escape"/);
  assert.match(focusHook, /event\.key !== "Tab"/);
  assert.match(focusHook, /previouslyFocused/);
  assert.match(focusHook, /previouslyFocused\.focus\(\)/);
});

test("defines reusable hover feedback for active controls and command options", async () => {
  const [header, chat, modal, palette, css] = await Promise.all([
    read("components/AppHeader.tsx"),
    read("components/ChatPanel.tsx"),
    read("components/LoadSessionModal.tsx"),
    read("components/CommandPalette.tsx"),
    read("app/globals.css"),
  ]);

  for (const source of [header, chat, modal]) {
    assert.match(source, /className=(?:"|\{`)[^"`]*control/);
  }
  assert.match(palette, /command-option/);
  assert.match(css, /\.control--neutral:hover:not\(:disabled\)/);
  assert.match(css, /\.control--primary:hover:not\(:disabled\)/);
  assert.match(css, /\.control--ghost:hover:not\(:disabled\)/);
  assert.match(css, /\.command-option:hover/);
});

test("removes the unused terminal spinner from shared UI source", async () => {
  const source = (await Promise.all([
    read("lib/theme.ts"),
    read("app/page.tsx"),
    read("components/AppHeader.tsx"),
    read("components/ChatPanel.tsx"),
    read("components/LoadSessionModal.tsx"),
  ])).join("\n");

  assert.doesNotMatch(source, /\bSPIN\b|⠋|⠙|⠹|⠸|⠼|⠴|⠦|⠧|⠇|⠏/);
});

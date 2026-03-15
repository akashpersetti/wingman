"use client";

import { useState, useEffect, useRef } from "react";
import { initSession, sendMessage, resetSession, SessionExpiredError } from "@/lib/api";
import { Message } from "@/lib/types";
import { T, MONO, SPIN, EVALUATOR_PREFIX, nowHMS } from "@/lib/theme";
import AppHeader        from "@/components/AppHeader";
import AgentPanel       from "@/components/AgentPanel";
import ChatPanel        from "@/components/ChatPanel";
import LoadSessionModal from "@/components/LoadSessionModal";
import SplashScreen     from "@/components/ui/splash-screen";
import CommandPalette, { Command } from "@/components/CommandPalette";

export default function Home() {
  const [sessionId, setSessionId]               = useState<string | null>(null);
  const [message, setMessage]                   = useState("");
  const [successCriteria, setSuccessCriteria]   = useState("");
  const [history, setHistory]                   = useState<Message[]>([]);
  const [isLoading, setIsLoading]               = useState(false);
  const [isInitializing, setIsInitializing]     = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [showCriteria, setShowCriteria]         = useState(false);
  const [splashDone, setSplashDone]             = useState(false);
  const [copied, setCopied]                     = useState(false);
  const [showLoadSession, setShowLoadSession]   = useState(false);
  const [loadInput, setLoadInput]               = useState("");
  const [spinIdx, setSpinIdx]                   = useState(0);
  const [showPalette, setShowPalette]           = useState(false);

  const mainEndRef    = useRef<HTMLDivElement>(null);
  const evalEndRef    = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLTextAreaElement>(null);
  const criteriaRef   = useRef<HTMLTextAreaElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const mainMessages = history.filter(m => !m.content.startsWith(EVALUATOR_PREFIX));
  const evalMessages = history.filter(m =>  m.content.startsWith(EVALUATOR_PREFIX));

  /* Auto-scroll */
  useEffect(() => {
    mainEndRef.current?.scrollIntoView({ behavior: "smooth" });
    evalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isLoading]);

  useEffect(() => { initialize(); }, []);

  /* Spinner */
  useEffect(() => {
    if (!isLoading) return;
    const id = setInterval(() => setSpinIdx(i => (i + 1) % SPIN.length), 80);
    return () => clearInterval(id);
  }, [isLoading]);

  /* ⌘K / Ctrl+K */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowPalette(p => !p);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── Handlers ─────────────────────────────────────── */
  async function initialize() {
    setIsInitializing(true); setError(null);
    try {
      setSessionId(await initSession());
    } catch {
      setError("error: failed to connect to backend (port 8000)");
    } finally {
      setIsInitializing(false);
    }
  }

  async function handleSend() {
    if (!message.trim() || !sessionId || isLoading) return;
    const currentMessage = message;
    const prevHistory    = history;
    const ts             = nowHMS();

    setHistory(h => [...h, { role: "user", content: currentMessage, timestamp: ts }]);
    setMessage("");
    setIsLoading(true); setError(null);

    try {
      let activeId = sessionId;
      let newHistory: Message[];
      try {
        newHistory = await sendMessage(activeId, currentMessage, successCriteria);
      } catch (err) {
        if (err instanceof SessionExpiredError) {
          activeId = await initSession();
          setSessionId(activeId);
          newHistory = await sendMessage(activeId, currentMessage, successCriteria);
        } else { throw err; }
      }
      setHistory(newHistory!.map(m => m.timestamp ? m : { ...m, timestamp: nowHMS() }));
    } catch {
      setError("error: failed to send — please try again");
      setHistory(prevHistory);
      setMessage(currentMessage);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  async function handleReset() {
    if (!sessionId || isLoading) return;
    setIsLoading(true); setError(null);
    try {
      const newId = await resetSession(sessionId);
      setSessionId(newId);
      setHistory([]); setMessage(""); setSuccessCriteria("");
    } catch { setError("error: reset failed"); }
    finally  { setIsLoading(false); }
  }

  function handleCopySession() {
    if (!sessionId) return;
    navigator.clipboard.writeText(sessionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleLoadSession() {
    const id = loadInput.trim();
    if (!id) return;
    setSessionId(id); setHistory([]);
    setLoadInput(""); setShowLoadSession(false);
  }

  /* ── Command palette ──────────────────────────────── */
  const commands: Command[] = [
    /* Input */
    { id: "focus-input",        label: "Focus input",                                        action: () => inputRef.current?.focus() },
    { id: "send",               label: "Send message",               hint: "(current input)", action: handleSend },
    { id: "clear-input",        label: "Clear input",                                        action: () => setMessage("") },
    /* Success criteria */
    { id: "toggle-criteria",    label: "Toggle success criteria",                            action: () => setShowCriteria(c => !c) },
    { id: "focus-criteria",     label: "Focus success criteria",                             action: () => { setShowCriteria(true); setTimeout(() => criteriaRef.current?.focus(), 80); } },
    { id: "clear-criteria",     label: "Clear success criteria",                             action: () => setSuccessCriteria("") },
    /* Session */
    { id: "reset",              label: "Reset session",              hint: "(clears history)", action: handleReset },
    { id: "copy-session",       label: "Copy session ID",                                    action: handleCopySession },
    { id: "load-session",       label: "Load session",               hint: "(reconnect by ID)", action: () => setShowLoadSession(true) },
    /* Chat history */
    { id: "copy-last-response", label: "Copy last AI response",                              action: () => {
        const last = [...history].reverse().find(m => m.role === "assistant" && !m.content.startsWith(EVALUATOR_PREFIX));
        if (last) navigator.clipboard.writeText(last.content);
      }},
    { id: "copy-last-user",     label: "Copy last user message",                             action: () => {
        const last = [...history].reverse().find(m => m.role === "user");
        if (last) navigator.clipboard.writeText(last.content);
      }},
    { id: "copy-conversation",  label: "Copy full conversation",     hint: "(to clipboard)",  action: () => {
        const lines = history
          .filter(m => !m.content.startsWith(EVALUATOR_PREFIX))
          .map(m => `[${m.timestamp ?? ""}] ${m.role === "user" ? "you" : "wingman"}: ${m.content}`)
          .join("\n\n");
        navigator.clipboard.writeText(lines);
      }},
    { id: "clear-history",      label: "Clear chat display",         hint: "(keeps session)",  action: () => setHistory([]) },
    /* Navigation */
    { id: "scroll-top",         label: "Scroll chat to top",                                 action: () => chatScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" }) },
    { id: "scroll-bottom",      label: "Scroll chat to bottom",                              action: () => mainEndRef.current?.scrollIntoView({ behavior: "smooth" }) },
    /* Page */
    { id: "reload",             label: "Reload page",                                        action: () => window.location.reload() },
  ];

  const inputDisabled = isLoading || isInitializing || !sessionId;

  return (
    <>
      {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
      {showPalette && <CommandPalette commands={commands} onClose={() => setShowPalette(false)} />}

      <div style={{ ...MONO, background: T.bg, color: T.text, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", fontSize: "13px" }}>

        <AppHeader
          sessionId={sessionId}
          isLoading={isLoading}
          spinIdx={spinIdx}
          copied={copied}
          onCopySession={handleCopySession}
          onOpenPalette={() => setShowPalette(true)}
          onLoadSession={() => setShowLoadSession(true)}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <AgentPanel
            isLoading={isLoading}
            evalMessages={evalMessages}
            evalEndRef={evalEndRef}
          />
          <ChatPanel
            isInitializing={isInitializing}
            isLoading={isLoading}
            error={error}
            spinIdx={spinIdx}
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

      <LoadSessionModal
        open={showLoadSession}
        loadInput={loadInput}
        setLoadInput={setLoadInput}
        onClose={() => setShowLoadSession(false)}
        onConnect={handleLoadSession}
      />
    </>
  );
}

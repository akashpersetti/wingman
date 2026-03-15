import { Message } from "./types";

// In production (deployed to S3/CloudFront), leave NEXT_PUBLIC_API_URL empty so
// calls use relative paths (/api/*). CloudFront routes /api/* to EC2.
// In local dev, set NEXT_PUBLIC_API_URL=http://localhost:8000 in .env.local.
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function initSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/init`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to initialize session");
  const data = await res.json();
  return data.session_id;
}

export class SessionExpiredError extends Error {}

export async function sendMessage(
  sessionId: string,
  message: string,
  successCriteria?: string
): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      message,
      success_criteria: successCriteria || null,
    }),
  });
  if (res.status === 404) throw new SessionExpiredError("Session expired");
  if (!res.ok) throw new Error("Failed to send message");
  const data = await res.json();
  return data.history;
}

export async function loadSession(sessionId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/api/history/${sessionId}`);
  if (res.status === 404) throw new SessionExpiredError("Session not found");
  if (!res.ok) throw new Error("Failed to load session");
  const data = await res.json();
  return data.history;
}

export async function resetSession(sessionId: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error("Failed to reset session");
  const data = await res.json();
  return data.session_id;
}

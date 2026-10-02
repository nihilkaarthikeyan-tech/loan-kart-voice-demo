import { useCallback, useEffect, useRef, useState } from "react";
import type { ConversationAgent } from "sarvam-conv-ai-sdk/browser";
import {
  AgentState,
  createKavyaAgent,
  fetchKavyaConfig,
  type KavyaConfig,
} from "../services/kavyaAgent";
import {
  classifyConnectError,
  classifyMicError,
  devDetailOf,
  KavyaError,
  type ErrorCode,
} from "../lib/errors";

export type ConversationStatus =
  | "idle"
  | "connecting"
  | "listening" // Kavya is listening (user silent)
  | "user_speaking" // user is talking
  | "speaking" // Kavya is talking
  | "ended";

const CONNECT_TIMEOUT_SECONDS = 20;

function browserSupportsVoice(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof WebSocket !== "undefined" &&
    (typeof AudioContext !== "undefined" ||
      typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext !==
        "undefined") &&
    window.isSecureContext
  );
}

/** Ask for the microphone up-front so permission errors are clear and early. */
async function preflightMicrophone(): Promise<void> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((t) => t.stop());
}

export function useKavyaConversation() {
  const [status, setStatus] = useState<ConversationStatus>("idle");
  const [error, setError] = useState<ErrorCode | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const agentRef = useRef<ConversationAgent | null>(null);
  const levelRef = useRef(0); // 0..1, read by the orb on each animation frame
  const endedByRef = useRef<"user" | "agent" | null>(null);
  const sawSocketErrorRef = useRef(false);

  const isActive = status === "connecting" || status === "listening" ||
    status === "user_speaking" || status === "speaking";

  const teardown = useCallback(async () => {
    const agent = agentRef.current;
    agentRef.current = null;
    levelRef.current = 0;
    setIsMuted(false);
    if (agent) {
      try {
        await agent.stop();
      } catch (err) {
        console.warn("[kavya] stop() failed", err);
      }
    }
  }, []);

  const start = useCallback(async () => {
    if (agentRef.current) return;
    setError(null);
    setErrorDetail(null);
    endedByRef.current = null;
    sawSocketErrorRef.current = false;

    if (!browserSupportsVoice()) {
      setError("unsupported_browser");
      return;
    }
    if (navigator.onLine === false) {
      setError("offline");
      return;
    }

    setStatus("connecting");

    // 1. Make sure the site is configured before bothering the user with a mic prompt.
    let config: KavyaConfig;
    try {
      config = await fetchKavyaConfig();
    } catch (err) {
      console.error("[kavya] configuration check failed", err);
      setStatus("idle");
      setError(classifyConnectError(err));
      setErrorDetail(devDetailOf(err) ?? null);
      return;
    }

    // 2. Ask for the microphone explicitly so permission errors are clear.
    try {
      await preflightMicrophone();
    } catch (err) {
      console.warn("[kavya] microphone pre-flight failed", err);
      setStatus("idle");
      setError(classifyMicError(err));
      setErrorDetail(devDetailOf(err) ?? null);
      return;
    }

    // 3. Connect to the existing Kavya agent through our proxy.
    let agent: ConversationAgent;
    try {
      agent = createKavyaAgent(config, {
        onState: (state) => {
          if (agentRef.current !== agent) return;
          if (state === AgentState.SPEAKING) setStatus("speaking");
          else if (state === AgentState.LISTENING) setStatus("listening");
          else if (state === AgentState.ERROR) sawSocketErrorRef.current = true;
        },
        onLevel: (level) => {
          // rms is ~0..0.3 for normal speech; scale so the orb reacts visibly.
          levelRef.current = Math.min(1, level.rms * 4);
        },
        onEvent: (event) => {
          if (agentRef.current !== agent) return;
          if (event.type === "server.event.user_speech_start") {
            setStatus((s) => (s === "listening" ? "user_speaking" : s));
          } else if (event.type === "server.event.user_speech_end") {
            setStatus((s) => (s === "user_speaking" ? "listening" : s));
          }
        },
        onEnd: () => {
          // Fired for both user stop() and agent-initiated interaction_end.
          if (!endedByRef.current) endedByRef.current = "agent";
        },
      });
      agentRef.current = agent;

      await agent.start(); // GET signed URL via our proxy, open WebSocket
      const connected = await agent.waitForConnect(CONNECT_TIMEOUT_SECONDS);
      if (agentRef.current !== agent) return; // ended while connecting
      if (!connected) {
        throw new KavyaError(sawSocketErrorRef.current ? "connect_failed" : "timeout");
      }
    } catch (err) {
      console.error("[kavya] failed to connect", err);
      const code = classifyConnectError(err);
      await teardown();
      setStatus("idle");
      setError(code);
      setErrorDetail(devDetailOf(err) ?? null);
      return;
    }

    setStatus("listening");

    // Detect network drops and agent-initiated hang-ups. The SDK resolves this
    // promise whenever the socket closes, whatever the reason.
    agent.waitForDisconnect().then(() => {
      if (agentRef.current !== agent) return; // we already tore it down
      const endedBy = endedByRef.current;
      agentRef.current = null;
      levelRef.current = 0;
      setIsMuted(false);
      setStatus("ended");
      if (endedBy !== "agent" && endedBy !== "user") {
        setError(navigator.onLine === false ? "offline" : "connection_lost");
      }
      agent.stop().catch(() => undefined);
    });
  }, [teardown]);

  const end = useCallback(async () => {
    endedByRef.current = "user";
    await teardown();
    setStatus("ended");
  }, [teardown]);

  const reset = useCallback(() => {
    setError(null);
    setErrorDetail(null);
    setStatus("idle");
  }, []);

  const toggleMute = useCallback(() => {
    const agent = agentRef.current;
    if (!agent) return;
    if (agent.isMuted()) {
      agent.unmute();
      setIsMuted(false);
    } else {
      agent.mute();
      setIsMuted(true);
    }
  }, []);

  // Clean up when the component unmounts or the page is closed / backgrounded away.
  useEffect(() => {
    const onPageHide = () => {
      agentRef.current?.stop().catch(() => undefined);
      agentRef.current = null;
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      onPageHide();
    };
  }, []);

  return {
    status,
    error,
    errorDetail,
    isMuted,
    isActive,
    levelRef,
    start,
    end,
    reset,
    toggleMute,
  };
}

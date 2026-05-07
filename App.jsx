import { useState, useRef, useEffect, useCallback } from "react";

// ── Personnalités multilingues ──────────────────────────────────────────────
const PERSONALITIES = {
  fr: {
    system: `Tu es Samyrdelan, un assistant IA professionnel et formel. Tu t'exprimes avec rigueur, précision et courtoisie. Tu utilises un vocabulaire soutenu, tu structures clairement tes réponses et tu vouvoies l'utilisateur. Tu réponds toujours en français. Utilise le markdown pour formater tes réponses : **gras**, *italique*, listes, tableaux si nécessaire.`,
    placeholder: "Saisissez votre message… (Entrée pour envoyer)",
    clearLabel: "Effacer la conversation",
    clearConfirm: "Voulez-vous effacer toute la conversation ?",
    copied: "Copié !",
    copy: "Copier",
    online: "EN LIGNE",
    subtitle: "Votre assistant professionnel",
    poweredBy: "Samyrdelan · Propulsé par Claude · Anthropic",
    suggestions: [
      "Rédigez-moi un email professionnel",
      "Expliquez-moi le machine learning",
      "Bonnes pratiques en gestion de projet ?",
    ],
    startPrompt: "Commencez une conversation ou essayez une suggestion",
    historyNote: "historique sauvegardé",
    cancel: "Annuler",
    confirm: "Confirmer",
    errorMsg: "❌ Erreur de connexion. Veuillez réessayer.",
    thinking: "Réflexion en cours…",
  },
  en: {
    system: `You are Samyrdelan, a professional and formal AI assistant. You express yourself with rigor, precision and courtesy. You use formal language and structure your responses clearly. Always respond in English. Use markdown for formatting: **bold**, *italic*, lists, tables when needed.`,
    placeholder: "Type your message… (Enter to send)",
    clearLabel: "Clear conversation",
    clearConfirm: "Do you want to clear the entire conversation?",
    copied: "Copied!",
    copy: "Copy",
    online: "ONLINE",
    subtitle: "Your professional assistant",
    poweredBy: "Samyrdelan · Powered by Claude · Anthropic",
    suggestions: [
      "Write me a professional email",
      "Explain machine learning to me",
      "Best practices in project management?",
    ],
    startPrompt: "Start a conversation or try a suggestion",
    historyNote: "history saved",
    cancel: "Cancel",
    confirm: "Confirm",
    errorMsg: "❌ Connection error. Please try again.",
    thinking: "Thinking…",
  },
  es: {
    system: `Eres Samyrdelan, un asistente de IA profesional y formal. Te expresas con rigor, precisión y cortesía. Usas un vocabulario elevado y estructuras tus respuestas claramente. Responde siempre en español. Usa markdown para formatear: **negrita**, *cursiva*, listas, tablas cuando sea necesario.`,
    placeholder: "Escriba su mensaje… (Enter para enviar)",
    clearLabel: "Borrar conversación",
    clearConfirm: "¿Desea borrar toda la conversación?",
    copied: "¡Copiado!",
    copy: "Copiar",
    online: "EN LÍNEA",
    subtitle: "Su asistente profesional",
    poweredBy: "Samyrdelan · Desarrollado por Claude · Anthropic",
    suggestions: [
      "Redacte un correo profesional",
      "Explíqueme el aprendizaje automático",
      "¿Mejores prácticas en gestión de proyectos?",
    ],
    startPrompt: "Inicie una conversación o pruebe una sugerencia",
    historyNote: "historial guardado",
    cancel: "Cancelar",
    confirm: "Confirmar",
    errorMsg: "❌ Error de conexión. Inténtelo de nuevo.",
    thinking: "Pensando…",
  },
  de: {
    system: `Sie sind Samyrdelan, ein professioneller und formeller KI-Assistent. Sie drücken sich präzise, rigoros und höflich aus. Antworten Sie immer auf Deutsch. Nutzen Sie Markdown: **fett**, *kursiv*, Listen, Tabellen wenn nötig.`,
    placeholder: "Ihre Nachricht… (Enter zum Senden)",
    clearLabel: "Gespräch löschen",
    clearConfirm: "Möchten Sie das gesamte Gespräch löschen?",
    copied: "Kopiert!",
    copy: "Kopieren",
    online: "ONLINE",
    subtitle: "Ihr professioneller Assistent",
    poweredBy: "Samyrdelan · Powered by Claude · Anthropic",
    suggestions: [
      "Professionelle E-Mail schreiben",
      "Maschinelles Lernen erklären",
      "Best Practices im Projektmanagement?",
    ],
    startPrompt: "Beginnen Sie ein Gespräch oder versuchen Sie einen Vorschlag",
    historyNote: "Verlauf gespeichert",
    cancel: "Abbrechen",
    confirm: "Bestätigen",
    errorMsg: "❌ Verbindungsfehler. Bitte erneut versuchen.",
    thinking: "Denke nach…",
  },
};

const STORAGE_KEY = "samyrdelan_v2_history";
const langFlags = { fr: "🇫🇷", en: "🇬🇧", es: "🇪🇸", de: "🇩🇪" };

// ── Composant : indicateur de frappe ──────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#38bdf8",
            animation: `dotBounce 1.3s ${i * 0.18}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

// ── Rendu Markdown minimal ───────────────────────────────────────────────
function inlineMarkdown(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/s);
    const italicMatch = remaining.match(/^(.*?)\*(.+?)\*/s);
    const codeMatch = remaining.match(/^(.*?)`(.+?)`/s);

    const matches = [
      boldMatch && { type: "bold", match: boldMatch, idx: boldMatch[1].length },
      italicMatch && { type: "italic", match: italicMatch, idx: italicMatch[1].length },
      codeMatch && { type: "code", match: codeMatch, idx: codeMatch[1].length },
    ].filter(Boolean);

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const earliest = matches.reduce((a, b) => (a.idx <= b.idx ? a : b));
    const { type, match } = earliest;

    if (match[1]) parts.push(<span key={key++}>{match[1]}</span>);

    if (type === "bold") {
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: "#f0f9ff" }}>{match[2]}</strong>);
      remaining = remaining.slice(match[1].length + match[2].length + 4);
    } else if (type === "italic") {
      parts.push(<em key={key++} style={{ fontStyle: "italic", color: "#bae6fd" }}>{match[2]}</em>);
      remaining = remaining.slice(match[1].length + match[2].length + 2);
    } else if (type === "code") {
      parts.push(
        <code key={key++} style={{
          background: "rgba(0,0,0,0.3)", padding: "2px 7px", borderRadius: 5,
          fontSize: "0.88em", fontFamily: "'JetBrains Mono', monospace", color: "#7dd3fc",
        }}>{match[2]}</code>
      );
      remaining = remaining.slice(match[1].length + match[2].length + 2);
    }
  }
  return parts;
}

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={key++} style={{
          background: "rgba(0,0,0,0.45)", border: "1px solid rgba(56,189,248,0.12)",
          borderRadius: 10, padding: "12px 16px", overflowX: "auto", margin: "10px 0",
          fontSize: 13, lineHeight: 1.6, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", color: "#bae6fd",
        }}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i++;
      continue;
    }

    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const sizes = { 1: "20px", 2: "17px", 3: "15px" };
      elements.push(
        <div key={key++} style={{ fontWeight: 700, fontSize: sizes[level], color: "#e0f2fe", margin: "14px 0 6px", letterSpacing: "-0.01em" }}>
          {inlineMarkdown(hMatch[2])}
        </div>
      );
      i++; continue;
    }

    if (line.match(/^[-*+]\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^[-*+]\s/)) {
        items.push(lines[i].replace(/^[-*+]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={key++} style={{ paddingLeft: 20, margin: "8px 0" }}>
          {items.map((item, j) => <li key={j} style={{ margin: "4px 0", color: "#cbd5e1" }}>{inlineMarkdown(item)}</li>)}
        </ul>
      );
      continue;
    }

    if (line.match(/^\d+\.\s/)) {
      const items = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={key++} style={{ paddingLeft: 22, margin: "8px 0" }}>
          {items.map((item, j) => <li key={j} style={{ margin: "4px 0", color: "#cbd5e1" }}>{inlineMarkdown(item)}</li>)}
        </ol>
      );
      continue;
    }

    if (line.match(/^---+$/)) {
      elements.push(<hr key={key++} style={{ border: "none", borderTop: "1px solid rgba(56,189,248,0.15)", margin: "12px 0" }} />);
      i++; continue;
    }

    if (line.trim() === "") {
      elements.push(<div key={key++} style={{ height: 8 }} />);
      i++; continue;
    }

    elements.push(
      <p key={key++} style={{ margin: "4px 0", lineHeight: 1.75, color: "#e2e8f0" }}>
        {inlineMarkdown(line)}
      </p>
    );
    i++;
  }
  return elements;
}

// ── Composant : bulle de message ─────────────────────────────────────────
function Message({ msg, t, isLast, isStreaming }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div style={{
      display: "flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 20, animation: "fadeUp 0.28s ease forwards",
      gap: 10, alignItems: "flex-start",
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: 11,
          background: "linear-gradient(135deg, #0369a1 0%, #38bdf8 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, flexShrink: 0, marginTop: 2,
          boxShadow: "0 0 16px rgba(56,189,248,0.3)",
        }}>⬡</div>
      )}

      <div style={{ maxWidth: "74%", minWidth: 0 }}>
        <div style={{
          background: isUser
            ? "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)"
            : "rgba(255,255,255,0.045)",
          border: isUser ? "none" : "1px solid rgba(56,189,248,0.13)",
          color: "#e0f2fe", padding: "12px 17px",
          borderRadius: isUser ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
          fontSize: 14.5, lineHeight: 1.7,
          backdropFilter: isUser ? "none" : "blur(14px)",
          boxShadow: isUser ? "0 4px 20px rgba(3,105,161,0.3)" : "none",
          wordBreak: "break-word",
        }}>
          {isUser ? (
            <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
          ) : (
            <div>
              {renderMarkdown(msg.content)}
              {isStreaming && isLast && (
                <span style={{
                  display: "inline-block", width: 2, height: "1em",
                  background: "#38bdf8", marginLeft: 3, verticalAlign: "text-bottom",
                  animation: "blink 0.8s step-end infinite",
                }} />
              )}
            </div>
          )}
        </div>

        {!isUser && msg.content && !isStreaming && (
          <button onClick={handleCopy} style={{
            marginTop: 6, marginLeft: 2,
            background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.16)",
            color: copied ? "#86efac" : "#7dd3fc", fontSize: 11, padding: "3px 11px",
            borderRadius: 100, cursor: "pointer", transition: "all 0.18s", letterSpacing: "0.02em",
          }}>
            {copied ? t.copied : t.copy}
          </button>
        )}
      </div>

      {isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: 11,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(56,189,248,0.18)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, flexShrink: 0, marginTop: 2,
        }}>◈</div>
      )}
    </div>
  );
}

// ── Application principale ────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("fr");
  const t = PERSONALITIES[lang];

  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 130) + "px";
    }
  }, [input]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const assistantIdx = history.length;
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      // Appel au proxy serverless Vercel — la clé API reste côté serveur
      const response = await fetch("/api/chat", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: t.system,
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok || !response.body) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.delta?.text || "";
            if (delta) {
              accumulated += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[assistantIdx] = { role: "assistant", content: accumulated };
                return updated;
              });
            }
          } catch {}
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIdx] = { role: "assistant", content: t.errorMsg };
          return updated;
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, messages, t]);

  const stopGeneration = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setShowClearModal(false);
  };

  return (
    <div style={{
      minHeight: "100vh", maxHeight: "100vh", overflow: "hidden",
      background: "radial-gradient(ellipse 120% 80% at 50% -10%, #082f49 0%, #0c1a2e 50%, #05101f 100%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: "#e0f2fe",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=Syne:wght@700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        textarea { resize: none; font-family: inherit; }
        textarea:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.22); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes dotBounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-7px); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulseRing { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.92) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>

      {/* Modal confirmation */}
      {showClearModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 200,
        }}>
          <div style={{
            background: "#0b1d2e", border: "1px solid rgba(56,189,248,0.22)",
            borderRadius: 22, padding: "30px 36px", maxWidth: 340, width: "90%",
            textAlign: "center", animation: "modalIn 0.22s ease",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🗑️</div>
            <p style={{ color: "#e0f2fe", fontSize: 15, lineHeight: 1.65, marginBottom: 26 }}>
              {t.clearConfirm}
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setShowClearModal(false)} style={{
                padding: "10px 24px", borderRadius: 100,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", fontSize: 13, cursor: "pointer",
              }}>{t.cancel}</button>
              <button onClick={clearChat} style={{
                padding: "10px 24px", borderRadius: 100,
                background: "linear-gradient(135deg, #991b1b, #dc2626)",
                border: "none", color: "#fff", fontSize: 13, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
              }}>{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div style={{ width: "100%", maxWidth: 760, padding: "18px 20px 0", display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {Object.entries(langFlags).map(([code, flag]) => (
              <button key={code} onClick={() => setLang(code)} title={code.toUpperCase()} style={{
                width: 34, height: 34, borderRadius: 10, fontSize: 16,
                background: lang === code ? "rgba(56,189,248,0.16)" : "rgba(255,255,255,0.04)",
                border: lang === code ? "1px solid rgba(56,189,248,0.48)" : "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: lang === code ? "0 0 12px rgba(56,189,248,0.18)" : "none",
              }}>{flag}</button>
            ))}
          </div>
          {messages.length > 0 && (
            <button onClick={() => setShowClearModal(true)} style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
              color: "#475569", fontSize: 12, padding: "7px 15px", borderRadius: 100,
              cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", gap: 5,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.borderColor = "rgba(248,113,113,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
            >🗑 {t.clearLabel}</button>
          )}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.15)",
          borderRadius: 100, padding: "5px 14px", marginBottom: 12,
          animation: "pulseRing 2.8s infinite",
        }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 }} />
          <span style={{ color: "#7dd3fc", fontSize: 11, fontWeight: 500, letterSpacing: "0.08em" }}>{t.online}</span>
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif", fontSize: "clamp(28px, 5vw, 40px)",
          fontWeight: 800, color: "#fff", letterSpacing: "-0.03em",
          lineHeight: 1.08, marginBottom: 6, textAlign: "center",
        }}>Samyrdelan</h1>

        <p style={{ color: "rgba(125,211,252,0.45)", fontSize: 13, fontWeight: 300, marginBottom: 4 }}>{t.subtitle}</p>

        {messages.length > 0 && (
          <p style={{ color: "rgba(100,116,139,0.48)", fontSize: 11 }}>
            {messages.length} message{messages.length > 1 ? "s" : ""} · {t.historyNote}
          </p>
        )}
      </div>

      {/* Zone messages */}
      <div style={{ width: "100%", maxWidth: 760, flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 18px 0" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", marginTop: 36, animation: "fadeUp 0.4s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.2 }}>⬡</div>
            <p style={{ color: "rgba(125,211,252,0.28)", fontSize: 13, marginBottom: 22 }}>{t.startPrompt}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {t.suggestions.map((s, i) => (
                <button key={i} onClick={() => { setInput(s); textareaRef.current?.focus(); }} style={{
                  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.15)",
                  color: "#7dd3fc", fontSize: 13, padding: "9px 17px", borderRadius: 100,
                  cursor: "pointer", transition: "all 0.2s", lineHeight: 1.4,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(56,189,248,0.1)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.15)"; }}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <Message key={i} msg={msg} t={t} isLast={i === messages.length - 1} isStreaming={loading} />
        ))}

        {loading && messages[messages.length - 1]?.content === "" && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18, animation: "fadeUp 0.28s ease" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 11,
              background: "linear-gradient(135deg, #0369a1, #38bdf8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, flexShrink: 0, boxShadow: "0 0 16px rgba(56,189,248,0.3)",
            }}>⬡</div>
            <div style={{
              background: "rgba(255,255,255,0.045)", border: "1px solid rgba(56,189,248,0.13)",
              borderRadius: "18px 18px 18px 5px", padding: "10px 16px", backdropFilter: "blur(14px)",
            }}>
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Zone de saisie */}
      <div style={{ width: "100%", maxWidth: 760, padding: "14px 18px 18px", flexShrink: 0 }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: 12,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(56,189,248,0.18)",
          borderRadius: 18, padding: "11px 14px", backdropFilter: "blur(20px)",
          boxShadow: "0 0 48px rgba(3,105,161,0.1)", transition: "border-color 0.2s",
        }}
        onFocusCapture={e => e.currentTarget.style.borderColor = "rgba(56,189,248,0.42)"}
        onBlurCapture={e => e.currentTarget.style.borderColor = "rgba(56,189,248,0.18)"}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={t.placeholder}
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#e0f2fe", fontSize: 14.5, lineHeight: 1.65,
              maxHeight: 130, overflowY: "auto", caretColor: "#38bdf8",
            }}
          />
          <button
            onClick={loading ? stopGeneration : sendMessage}
            disabled={!input.trim() && !loading}
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: loading
                ? "linear-gradient(135deg, #991b1b, #dc2626)"
                : input.trim()
                  ? "linear-gradient(135deg, #0369a1, #0284c7)"
                  : "rgba(255,255,255,0.05)",
              border: "none", cursor: input.trim() || loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: loading ? 14 : 20, flexShrink: 0, transition: "all 0.2s",
              boxShadow: loading ? "0 4px 16px rgba(220,38,38,0.35)" : input.trim() ? "0 4px 16px rgba(3,105,161,0.38)" : "none",
              color: "#fff",
            }}
          >{loading ? "■" : "↑"}</button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(100,116,139,0.32)", fontSize: 11, marginTop: 8, letterSpacing: "0.02em" }}>
          {t.poweredBy}
        </p>
      </div>
    </div>
  );
}

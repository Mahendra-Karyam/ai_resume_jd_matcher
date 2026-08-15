import React, { useEffect, useRef, useState } from "react";
import api from "../api/axios.js";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hi! I can help explain how ResumeMatcher works — uploading resumes, running matches, understanding your score, and more. What would you like to know?",
};

// Gemini replies in light Markdown (mainly **bold**). Rather than pulling in a
// full markdown library or using dangerouslySetInnerHTML (risky with AI text),
// this splits on **bold** markers and renders them as real <strong> elements,
// leaving everything else as plain text.
const renderFormattedText = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
};

export default function HelpChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError("");
    setSending(true);

    try {
      const history = messages
        .filter((m) => m !== WELCOME_MESSAGE)
        .map((m) => ({ role: m.role, text: m.text }));

      const { data } = await api.post("/assistant/chat", {
        message: trimmed,
        history,
      });

      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setMessages(messages);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-brand-600 hover:bg-brand-700
          text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        aria-label="Open help chat"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path 
            d="M6 6l12 12M6 18L18 6" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
            <path
              d="M4 5h16v11H8l-4 4V5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[92vw] max-w-sm h-[70vh] max-h-[520px]
          bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 bg-brand-600 text-white shrink-0">
            <p className="font-semibold text-sm">ResumeMatcher Help</p>
            <p className="text-xs text-brand-100">Ask me anything about the app</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] text-sm px-3 py-2 rounded-2xl whitespace-pre-wrap break-words
                    ${m.role === "user"
                      ? "bg-brand-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm"}`}
                >
                  {renderFormattedText(m.text)}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-400 text-sm px-3 py-2 rounded-2xl rounded-bl-sm">
                  Typing…
                </div>
              </div>
            )}
          </div>

          {error && <p className="px-3 pt-1 text-xs text-red-500 shrink-0">{error}</p>}

          <form onSubmit={handleSend} className="p-2.5 border-t border-gray-200 flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={sending}
              className="flex-1 border border-gray-300 rounded-full px-3.5 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full
                bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 transition-colors"
              aria-label="Send"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                <path d="M3 10h13M10 4l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
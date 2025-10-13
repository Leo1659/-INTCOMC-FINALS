"use client";
import { useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    const content = input.trim();
    if (!content || isLoading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      const assistantText = data?.content ?? "Sorry, something went wrong.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="px-4 py-3 border-b text-center sticky top-0 bg-background z-10">
        <h1 className="text-base font-semibold">PH Law Assistant</h1>
        <p className="text-xs text-black/60 dark:text-white/60 mt-1">
          Educational info only, not legal advice.
        </p>
      </header>

      <main className="flex-1 flex flex-col max-w-screen-sm w-full mx-auto px-4 py-4 gap-3">
        <div className="flex-1 overflow-y-auto flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="text-sm text-black/60 dark:text-white/60 mt-8 text-center">
              Ask about Philippine laws, rights, or procedures.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-2xl px-3 py-2 bg-black text-white text-sm"
                  : "self-start max-w-[85%] rounded-2xl px-3 py-2 bg-black/5 dark:bg-white/10 text-sm"
              }
            >
              {m.content}
            </div>
          ))}
          {isLoading && (
            <div className="self-start max-w-[85%] rounded-2xl px-3 py-2 bg-black/5 dark:bg-white/10 text-sm">
              Thinking…
            </div>
          )}
        </div>

        <div className="flex gap-2 items-center sticky bottom-0 bg-background py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your question"
            className="flex-1 border rounded-xl px-3 py-3 text-sm bg-transparent"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="rounded-xl px-4 py-3 text-sm font-medium bg-foreground text-background disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}

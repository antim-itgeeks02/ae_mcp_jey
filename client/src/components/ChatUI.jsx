import React, { useEffect, useRef, useState } from "react";

export default function ChatUI({ backendUrl = "http://localhost:3001" }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("disconnected");
  const [clientId, setClientId] = useState("");
  const esRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const es = new EventSource(`${backendUrl}/sse`);
console.log(es);

  es.addEventListener("session", (e) => {
    const { clientId } = JSON.parse(e.data);
    console.log(clientId);
    
    setClientId(clientId);
  });

  es.addEventListener("message", (e) => {
    const payload = JSON.parse(e.data);
    pushMessage(payload.role, payload.text);
  });


    es.onopen = () => {
      setStatus("connected");
      pushMessage("system", "Connected to backend SSE stream.");
    };

    es.onerror = () => {
      setStatus("error");
      pushMessage("system", "SSE connection error. Retrying...");
      es.close();
    };

    es.addEventListener("message", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        pushMessage(payload.role || "model", payload.text || "");
      } catch {}
    });

    es.addEventListener("function_call", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        pushMessage("model", `🔧 Function call: ${payload.name}`);
        callTool(payload.name, payload.args);
      } catch {}
    });

    es.addEventListener("tool_result", (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        pushMessage("tool", payload.result || `Tool ${payload.name} returned.`);
      } catch {}
    });

    return () => {
      es.close();
      esRef.current = null;
      setStatus("disconnected");
    };
  }, [backendUrl, clientId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function pushMessage(role, text) {
    setMessages((m) => [...m, { id: Math.random().toString(36).slice(2), role, text }]);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    if (!input.trim()) return;
    pushMessage("user", input.trim());
    const msg = input.trim();
    setInput("");
    await fetch(`${backendUrl}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, message: msg }),
    });
  }

  async function callTool(name, args) {
    await fetch(`${backendUrl}/callTool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name, args }),
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
        <header className="flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-bold">Gemini + MCP Chat</h1>
          <span className={`text-sm ${status === 'connected' ? 'text-green-500' : status === 'error' ? 'text-red-500' : 'text-yellow-500'}`}>{status}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-4 py-2 rounded-xl whitespace-pre-wrap leading-relaxed text-base
                  ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' :
                    m.role === 'model' ? 'bg-gray-100 text-gray-900 rounded-bl-none' :
                    m.role === 'tool' ? 'bg-yellow-100 text-gray-900 rounded-bl-none' :
                    'bg-purple-100 text-gray-900 text-sm italic mx-auto'}`}
              >
                {m.role !== 'system' && <div className="text-sm font-semibold mb-1">{m.role === 'user' ? 'You' : m.role === 'model' ? 'Assistant' : 'Tool'}</div>}
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>
        <form onSubmit={sendMessage} className="p-4 border-t flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring"
          />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">Send</button>
        </form>
      </div>
    </div>
  );
}

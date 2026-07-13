"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { endpoint } from "@/consts/backEndpoint";

interface Message {
    sender: "user" | "ai";
    text: string;
    timestamp: Date;
}

interface ChatBotWindowProps {
    closeChat: () => void;
    currentBlocks: any[];
    onBlocksUpdated: (newBlocks: any[]) => void; // <-- reemplaza a onRefreshData
}

export default function ChatBotWindow({ closeChat, currentBlocks, onBlocksUpdated }: ChatBotWindowProps) {
    const { id: eventId } = useParams();
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "ai",
            text: "¡Hablalo, varón! ¿Qué cuadre quieres hacer con los asistentes o colectivos hoy?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() === "" || loading) return;

        const userText = input.trim();
        setInput("");

        setMessages((prev) => [...prev, { sender: "user", text: userText, timestamp: new Date() }]);
        setLoading(true);

        try {
            const res = await fetch(`${endpoint}api/events/${eventId}/assistant/sync-participants`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userText,
                    // Le mandamos el estado ACTUAL (aún no guardado) del formulario.
                    current_context: currentBlocks,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Algo salió mal procesando tu comando, varón.");
            }

            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: data.message || "Listo, formulario actualizado.", timestamp: new Date() }
            ]);

            // La IA devuelve el JSON completo y actualizado del formulario.
            // Lo aplicamos directo al estado del padre, sin tocar la DB.
            if (Array.isArray(data.blocks)) {
                onBlocksUpdated(data.blocks);
            }

        } catch (error: any) {
            setMessages((prev) => [
                ...prev,
                { sender: "ai", text: `Error: ${error.message}`, timestamp: new Date() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full text-slate-100 font-sans">
            {/* Cabecera */}
            <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">Dictado por IA</h3>
                        <p className="text-[10px] text-slate-400">Edita el formulario, aún no guardado</p>
                    </div>
                </div>
                <button
                    onClick={closeChat}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Zona de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}
                    >
                        <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : "bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50"
                            }`}>
                            {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/30 px-3 py-2 rounded-2xl rounded-bl-none max-w-[40%] mr-auto text-[10px] font-bold text-indigo-400 tracking-wider">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input / Formulario */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    placeholder="Ej: Quita a Pedro y añade el grupo Mesa 3 con Luis..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white placeholder:text-slate-600 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all active:scale-95 shrink-0"
                >
                    <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
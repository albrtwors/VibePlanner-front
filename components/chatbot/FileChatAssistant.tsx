// components/chatbot/FileChatAssistant.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { endpoint } from "@/consts/backEndpoint";

interface SongPayload {
    id: number;
    name: string;
    author: string;
    genre: string | null;
}

interface Message {
    sender: "user" | "bot";
    text: string;
    songs?: SongPayload[];
    suggestedTitle?: string | null;
}

interface FileChatAssistantProps {
    closeChat: () => void;
    onApplySongs: (songs: SongPayload[], suggestedTitle?: string | null) => void;
}

export default function FileChatAssistant({ closeChat, onApplySongs }: FileChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "bot",
            text: "Soy tu asistente de setlists. Pídeme armar un repertorio con canciones específicas, buscar por género o por palabras clave."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${endpoint}api/files/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userText })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "bot",
                        text: data.bot_response,
                        songs: data.songs || [],
                        suggestedTitle: data.suggested_title
                    }
                ]);
            } else {
                throw new Error();
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "No pude conectar con el servidor de IA. Intenta de nuevo." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        // SOLUCIÓN AQUÍ: Limitamos rígidamente la altura máxima del componente a 75vh (o puedes cambiarlo a 500px si lo prefieres)
        <div className="flex flex-col h-full max-h-[75vh] min-h-[350px] bg-slate-950 text-slate-100 font-medium overflow-hidden rounded-xl border border-slate-800">

            {/* Header - Más compacto */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-100">Asistente VibePlanner</h3>
                        <p className="text-[9px] font-bold text-indigo-400 tracking-wide">Estructurador de Setlists</p>
                    </div>
                </div>
                <button onClick={closeChat} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Cuerpo del Chat - Reducido padding a p-3 */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900/40">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col max-w-[90%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>

                        {/* Globos de texto - Reducido padding */}
                        <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed font-semibold shadow-sm ${msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none font-bold"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                            }`}>
                            {msg.text}
                        </div>

                        {/* Tarjeta de canciones recomendadas - Altura interna limitada */}
                        {msg.sender === "bot" && msg.songs && msg.songs.length > 0 && (
                            <div className="mt-1.5 w-full min-w-[240px] max-w-xs bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-2 shadow-xl">
                                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800/60 pb-1">
                                    Resultados sugeridos
                                </div>
                                <div className="max-h-24 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                                    {msg.songs.map((song) => (
                                        <div key={song.id} className="flex flex-col min-w-0 bg-slate-950/60 border border-slate-800/40 rounded-md p-1.5">
                                            <span className="font-bold text-slate-100 text-[10px] truncate">{song.name}</span>
                                            <span className="text-[9px] font-semibold text-slate-400 truncate">{song.author}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => onApplySongs(msg.songs || [], msg.suggestedTitle)}
                                    className="w-full mt-0.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-all"
                                >
                                    + Aplicar ({msg.songs.length})
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="self-start flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl rounded-tl-none">
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input Form - Más compacto */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800/80 flex gap-2 shrink-0 z-10">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Arma un setlist con..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-[11px] px-3 py-2 rounded-lg text-slate-100 placeholder-slate-500 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-40"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-30 shrink-0"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
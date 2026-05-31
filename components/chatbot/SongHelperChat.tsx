// components/chatbot/SongHelperChat.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { notify } from "@/utils/toast";

interface SongStructure {
    name: string;
    author: string;
    genre: string;
    structure: { parts: Array<{ title: string; content: string }> };
}

interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    isLoading?: boolean;
    songData?: SongStructure | null;
}

interface VibeHelperChatProps {
    closeChat: () => void;
    onApplyStructure: (song: SongStructure) => void;
}

export default function VibeHelperChat({ closeChat, onApplyStructure }: VibeHelperChatProps) {
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "bot",
            text: "¡Hola! Escríbeme una canción para buscar o pégame unos versos desordenados y yo me encargaré de armar tu estructura ideal.",
        },
    ]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const promptText = chatInput.trim();
        if (!promptText) return;

        setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: promptText }]);
        setChatInput("");

        const loadingId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: loadingId, sender: "bot", text: "", isLoading: true }]);

        try {
            const response = await fetch("http://localhost:5000/api/songs/generate-ia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: promptText }),
            });
            const data = await response.json();

            setMessages((prev) =>
                prev.filter((m) => m.id !== loadingId).concat({
                    id: loadingId, sender: "bot", text: data.bot_response, songData: data.song_data,
                })
            );
        } catch (error) {
            setMessages((prev) =>
                prev.filter((m) => m.id !== loadingId).concat({
                    id: loadingId, sender: "bot", text: "Problemas de conexión con el servidor musical.",
                })
            );
            notify.error("Error al conectar con la IA.");
        }
    };

    const formatBotMessage = (text: string) => {
        return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
            part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-extrabold text-indigo-400">{part.slice(2, -2)}</strong> : part
        );
    };

    return (
        <>
            <div className="bg-slate-950 px-4 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100 tracking-wide">VibeHelper AI</h4>
                        <span className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">Engine Active</span>
                    </div>
                </div>
                <button onClick={closeChat} className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-900/40">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed border shadow-sm ${msg.sender === "user" ? "bg-indigo-600 border-indigo-500 text-slate-50 rounded-tr-none" : "bg-slate-800/60 border-slate-700/50 text-slate-200 rounded-tl-none"}`}>
                            {msg.isLoading ? (
                                <div className="flex items-center gap-1.5 py-1 px-2">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
                                </div>
                            ) : formatBotMessage(msg.text)}

                            {msg.songData && (
                                <div className="mt-3 pt-3 border-t border-slate-700/50 flex flex-col gap-2">
                                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                                        <div><span className="text-slate-500 font-medium">Artista:</span> <span className="text-slate-200 font-semibold">{msg.songData.author}</span></div>
                                        <div><span className="text-slate-500 font-medium">Género:</span> <span className="text-slate-200 font-semibold">{msg.songData.genre || "N/A"}</span></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onApplyStructure(msg.songData!)}
                                        className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                                    >
                                        Volcar al Formulario Principal
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
                <input type="text" placeholder="Escribe un tema o pega letras aquí..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all" />
                <button type="submit" className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
            </form>
        </>
    );
}
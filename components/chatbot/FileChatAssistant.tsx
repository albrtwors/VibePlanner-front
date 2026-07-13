"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Plus, Minus, Check, Loader2 } from "lucide-react";
import { endpoint } from "@/consts/backEndpoint";

interface SongPayload {
    id: number;
    name: string;
    author: string;
    genre: string | null;
}

export interface ChatAssistantActions {
    add: SongPayload[];
    remove: SongPayload[];
}

interface Message {
    id: string;
    sender: "user" | "bot";
    text: string;
    songsToAdd?: SongPayload[];
    songsToRemove?: SongPayload[];
    suggestedTitle?: string | null;
    applied?: boolean;
}

interface CurrentSongContext {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
}

interface FileChatAssistantProps {
    closeChat: () => void;
    onApplySongs: (actions: ChatAssistantActions, suggestedTitle?: string | null) => void;
    currentSongs: CurrentSongContext[];
}

const messageVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 350, damping: 26 }
    }
};

const actionCardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { delay: 0.1, type: "spring", stiffness: 300, damping: 24 }
    }
};

export default function FileChatAssistant({ closeChat, onApplySongs, currentSongs }: FileChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            sender: "bot",
            text: "Soy tu asistente de setlists. Pídeme armar un repertorio con canciones específicas, buscar por género, artista o palabras clave — o también puedo quitar canciones que ya estén en tu cancionero actual."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll adaptativo e inteligente
    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 60);
    }, [messages, isLoading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userText = input.trim();
        setInput("");

        const userMsgId = `user-${Date.now()}`;
        setMessages((prev) => [...prev, { id: userMsgId, sender: "user", text: userText }]);
        setIsLoading(true);

        try {
            const res = await fetch(`${endpoint}api/files/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: userText,
                    current_songs: currentSongs.map((s) => ({
                        id: s.id,
                        name: s.name,
                        author: s.author,
                        genre: s.genre
                    }))
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `bot-${Date.now()}`,
                        sender: "bot",
                        text: data.bot_response,
                        songsToAdd: data.songs_to_add || [],
                        songsToRemove: data.songs_to_remove || [],
                        suggestedTitle: data.suggested_title
                    }
                ]);
            } else {
                throw new Error();
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    sender: "bot",
                    text: "No pude conectar con el servidor de IA. Intenta de nuevo, mano."
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApply = (id: string, msg: Message) => {
        onApplySongs(
            { add: msg.songsToAdd || [], remove: msg.songsToRemove || [] },
            msg.suggestedTitle
        );
        setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, applied: true } : m))
        );
    };

    return (
        <div className="flex flex-col h-full max-h-[75vh] min-h-[380px] bg-slate-950 text-slate-100 font-medium overflow-hidden rounded-xl border border-slate-800 shadow-2xl relative z-50">

            {/* Header */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800/80 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-100 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-indigo-400 fill-indigo-400/20" /> Asistente VibePlanner
                        </h3>
                        <p className="text-[9px] font-bold text-indigo-400 tracking-wide mt-0.5">Estructurador de Setlists AI</p>
                    </div>
                </div>
                <button
                    onClick={closeChat}
                    className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Cuerpo del Chat */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900/30 overflow-x-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                    {messages.map((msg) => {
                        const totalCambios = (msg.songsToAdd?.length || 0) + (msg.songsToRemove?.length || 0);
                        const isUser = msg.sender === "user";

                        return (
                            <motion.div
                                key={msg.id}

                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                                className={`flex flex-col max-w-[85%] ${isUser ? "self-end items-end" : "self-start items-start"}`}
                            >
                                {/* Globo de texto */}
                                <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed font-semibold shadow-md border ${isUser
                                    ? "bg-indigo-600 border-indigo-500 text-white rounded-tr-none font-bold"
                                    : "bg-slate-900 border-slate-800 text-slate-200 rounded-tl-none"
                                    }`}>
                                    {msg.text}
                                </div>

                                {/* Tarjeta de cambios sugeridos */}
                                {!isUser && totalCambios > 0 && (
                                    <motion.div

                                        className="mt-2 w-full min-w-[240px] max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2.5 shadow-xl"
                                    >
                                        {/* Bloque: Agregar */}
                                        {msg.songsToAdd && msg.songsToAdd.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-400 border-b border-slate-800/60 pb-1 flex items-center gap-1">
                                                    <Plus className="w-2.5 h-2.5 stroke-[3]" /> Agregar ({msg.songsToAdd.length})
                                                </div>
                                                <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-0.5 custom-scrollbar">
                                                    {msg.songsToAdd.map((song) => (
                                                        <div key={`add-${song.id}`} className="flex flex-col min-w-0 bg-slate-950/60 border border-slate-800/40 rounded-lg p-2 transition-colors hover:border-slate-800">
                                                            <span className="font-bold text-slate-100 text-[10px] truncate">{song.name}</span>
                                                            <span className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">{song.author}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Bloque: Quitar */}
                                        {msg.songsToRemove && msg.songsToRemove.length > 0 && (
                                            <div className="flex flex-col gap-1.5">
                                                <div className="text-[9px] font-black uppercase tracking-wider text-rose-400 border-b border-slate-800/60 pb-1 flex items-center gap-1">
                                                    <Minus className="w-2.5 h-2.5 stroke-[3]" /> Quitar ({msg.songsToRemove.length})
                                                </div>
                                                <div className="max-h-24 overflow-y-auto flex flex-col gap-1 pr-0.5 custom-scrollbar">
                                                    {msg.songsToRemove.map((song) => (
                                                        <div key={`remove-${song.id}`} className="flex flex-col min-w-0 bg-slate-950/60 border border-rose-950/20 rounded-lg p-2 transition-colors hover:border-rose-900/30">
                                                            <span className="font-bold text-slate-100 text-[10px] truncate">{song.name}</span>
                                                            <span className="text-[9px] font-semibold text-slate-400 truncate mt-0.5">{song.author}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Botón de Acción */}
                                        <motion.button
                                            whileHover={!msg.applied ? { scale: 1.01 } : {}}
                                            whileTap={!msg.applied ? { scale: 0.99 } : {}}
                                            onClick={() => handleApply(msg.id, msg)}
                                            disabled={msg.applied}
                                            className={`w-full mt-0.5 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm border ${msg.applied
                                                ? "bg-slate-950 border-slate-800/80 text-slate-500 disabled:opacity-100"
                                                : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                                                }`}
                                        >
                                            {msg.applied ? (
                                                <>
                                                    <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> Aplicado con éxito
                                                </>
                                            ) : (
                                                `Aplicar cambios (${totalCambios})`
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}

                    {/* Burbuja de Carga con Animación Elástica */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="self-start flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-2.5 rounded-xl rounded-tl-none shadow-md"
                        >
                            <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pensando setlist...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={scrollRef} className="h-1 shrink-0" />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800/80 flex gap-2 shrink-0 z-10">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Agrega 3 de rock y quita las viejas..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/70 text-[11px] px-3.5 py-2.5 rounded-lg text-slate-100 placeholder-slate-500 font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 disabled:opacity-40 transition-all duration-300"
                />
                <motion.button
                    whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                    whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-20 shrink-0 border border-indigo-500/40 flex items-center justify-center"
                >
                    <Send className="w-3.5 h-3.5" />
                </motion.button>
            </form>
        </div>
    );
}
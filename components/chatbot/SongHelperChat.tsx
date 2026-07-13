"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Send, Sparkles, CheckSquare, Loader2 } from "lucide-react";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

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

// Variantes de animación para los globos de texto
const messageVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 12 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 260, damping: 20 }
    }
};

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const promptText = chatInput.trim();
        if (!promptText) return;

        const userId = Date.now().toString();
        setMessages((prev) => [...prev, { id: userId, sender: "user", text: promptText }]);
        setChatInput("");

        const loadingId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: loadingId, sender: "bot", text: "", isLoading: true }]);

        try {
            const response = await fetch(`${endpoint}api/songs/generate-ia`, {
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
            part.startsWith("**") && part.endsWith("**") ?
                <strong key={i} className="font-extrabold text-indigo-400">{part.slice(2, -2)}</strong> : part
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-950">
            {/* Header */}
            <div className="bg-slate-950 px-4 py-4 border-b border-slate-800/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <Mic className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-100 tracking-wide">VibeHelper AI</h4>
                        <span className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 animate-spin [animation-duration:3s]" /> Engine Active
                        </span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeChat}
                    className="text-slate-400 hover:text-slate-100 p-1.5 rounded-xl hover:bg-slate-800/40 transition-colors"
                >
                    <X className="w-5 h-5" />
                </motion.button>
            </div>

            {/* Cuerpo del Chat */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-gradient-to-b from-slate-950 to-slate-900/20 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            layout

                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                        >
                            <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed border shadow-md transition-shadow duration-300 ${msg.sender === "user"
                                ? "bg-indigo-600 border-indigo-500 text-slate-50 rounded-tr-none shadow-indigo-600/5"
                                : "bg-slate-900/90 border-slate-800 text-slate-200 rounded-tl-none backdrop-blur-sm"
                                }`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center gap-1.5 py-1 px-2">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                ) : (
                                    formatBotMessage(msg.text)
                                )}

                                {/* Caja interna de canción sugerida */}
                                {msg.songData && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-2"
                                    >
                                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                                            <div><span className="text-slate-500 font-medium">Artista:</span> <span className="text-slate-200 font-semibold">{msg.songData.author}</span></div>
                                            <div><span className="text-slate-500 font-medium">Género:</span> <span className="text-slate-200 font-semibold">{msg.songData.genre || "N/A"}</span></div>
                                        </div>

                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            onClick={() => onApplyStructure(msg.songData!)}
                                            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/10 flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" /> Volcar al Formulario Principal
                                        </motion.button>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/60 bg-slate-950 flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    placeholder="Escribe un tema o pega letras aquí..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 placeholder:text-slate-600"
                />

                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-xl transition-colors shadow-lg shadow-indigo-600/10 flex items-center justify-center"
                >
                    <Send className="w-4 h-4" />
                </motion.button>
            </form>
        </div>
    );
}
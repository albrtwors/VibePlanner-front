"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, X, Eye, Sparkles } from "lucide-react";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface SongPart {
    title: string;
    content: string;
}

interface Message {
    id: string;
    sender: "user" | "ai";
    text: string;
    isLoading?: boolean;
}

interface SongChatAssistantProps {
    closeChat: () => void;
    onUpdateStructure: (newParts: SongPart[]) => void;
}

const messageVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: "spring", stiffness: 260, damping: 20 }
    }
};

export default function SongChatAssistant({ closeChat, onUpdateStructure }: SongChatAssistantProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "initial",
            sender: "ai",
            text: "¡Hola de nuevo, varón! Ahora sí puedes adjuntar la foto de tu libreta musical o partitura usando el clip. Yo me encargaré de transcribir los acordes en el formato exacto."
        }
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    // Auto-scroll fluido al recibir o enviar mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // MANEJO DE ENVIAR TEXTO PLANO
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userText = input.trim();
        setInput("");

        const userId = Date.now().toString();
        setMessages((prev) => [...prev, { id: userId, sender: "user", text: userText }]);
        setSending(true);

        const loadingId = (Date.now() + 1).toString();
        // Insertamos burbuja de carga simulada
        setMessages((prev) => [...prev, { id: loadingId, sender: "ai", text: "", isLoading: true }]);

        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            setMessages((prev) =>
                prev.filter((m) => m.id !== loadingId).concat({
                    id: loadingId,
                    sender: "ai",
                    text: "Entendido, varón. Si deseas transcribir un cifrado completo con visión artificial, recuerda tocar el ícono de clip 📎 para procesar tu cuaderno."
                })
            );
        } catch (error) {
            setMessages((prev) => prev.filter((m) => m.id !== loadingId));
            notify.error("Error al procesar el mensaje.");
        } finally {
            setSending(false);
        }
    };

    // PROCESAMIENTO MULTIMODAL REAL
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSending(true);
        const userId = Date.now().toString();
        setMessages((prev) => [...prev, { id: userId, sender: "user", text: `📸 Subiendo y analizando: ${file.name}...` }]);

        const loadingId = (Date.now() + 1).toString();
        setMessages((prev) => [...prev, { id: loadingId, sender: "ai", text: "", isLoading: true }]);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 1000;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const base64Pure = canvas.toDataURL("image/jpeg", 0.65).split(",")[1];

                try {
                    const res = await fetch(`${endpoint}api/songs/upload-vision`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image_base64: base64Pure }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "No se pudo interpretar.");

                    if (data.structure && data.structure.parts) {
                        onUpdateStructure(data.structure.parts);
                        setMessages((prev) =>
                            prev.filter((m) => m.id !== loadingId).concat({
                                id: loadingId,
                                sender: "ai",
                                text: `¡Listo, varón! He detectado la canción "${data.detected_name || 'Estructura Escaneada'}". Ya inyecté las estrofas y los acordes en tu pantalla principal.`
                            })
                        );
                        notify.success("Cifrado acoplado desde el Chatbot.");
                    }
                } catch (err: any) {
                    setMessages((prev) =>
                        prev.filter((m) => m.id !== loadingId).concat({
                            id: loadingId,
                            sender: "ai",
                            text: `❌ Error: ${err.message || 'No pude procesar esa imagen.'}`
                        })
                    );
                } finally {
                    setSending(false);
                }
            };
        };
    };

    return (
        <div className="w-85 h-96 bg-slate-900 border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-slate-950 p-3 border-b border-slate-800/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                        <Eye className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-tight">Asistente Multimodal v2</span>
                        <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 animate-spin [animation-duration:4s]" /> Vision AI Active
                        </span>
                    </div>
                </div>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={closeChat}
                    className="text-slate-500 hover:text-slate-300 p-1 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </motion.button>
            </div>

            {/* Mensajes con AnimatePresence */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-gradient-to-b from-slate-900/40 to-slate-950/25 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            layout

                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed font-medium border shadow-sm ${msg.sender === "user"
                                ? "bg-indigo-600 border-indigo-500 text-slate-100 rounded-tr-none"
                                : "bg-slate-950 border-slate-800 text-slate-300 rounded-tl-none"
                                }`}>
                                {msg.isLoading ? (
                                    <div className="flex items-center gap-1 py-1 px-1.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Formulario con Clip Multimodal */}
            <form onSubmit={handleSendMessage} className="p-2 bg-slate-950 border-t border-slate-800/80 flex gap-2 items-center shrink-0">
                <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={sending}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50"
                    title="Subir foto de partitura"
                >
                    <Paperclip className="w-3.5 h-3.5" />
                </motion.button>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={sending ? "Procesando..." : "Escribe un mensaje..."}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 placeholder:text-slate-600"
                    disabled={sending}
                />

                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={sending || !input.trim()}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 rounded-lg transition-colors shadow-md shadow-indigo-600/10 flex items-center justify-center disabled:opacity-40"
                >
                    <Send className="w-3.5 h-3.5" />
                </motion.button>
            </form>
        </div>
    );
}
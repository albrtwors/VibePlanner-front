"use client";
import { useState, useRef } from "react";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface SongPart {
    title: string;
    content: string;
}

interface SongChatAssistantProps {
    closeChat: () => void;
    onUpdateStructure: (newParts: SongPart[]) => void;
}

export default function SongChatAssistant({ closeChat, onUpdateStructure }: SongChatAssistantProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
        { sender: "ai", text: "¡Hola de nuevo, varón! Ahora sí puedes adjuntar la foto de tu libreta musical o partitura usando el clip. Yo me encargaré de transcribir los acordes en el formato exacto." }
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    // MANEJO DE ENVIAR TEXTO PLANO
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userText = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setSending(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 800));
            setMessages((prev) => [...prev, {
                sender: "ai",
                text: "Entendido, varón. Si deseas transcribir un cifrado completo con visión artificial, recuerda tocar el ícono de clip 📎 para procesar tu cuaderno."
            }]);
        } catch (error) {
            notify.error("Error al procesar el mensaje.");
        } finally {
            setSending(false);
        }
    };

    // PROCESAMIENTO MULTIMODAL REAL (FOTO -> BASE64 -> FLASK DESDE EL CHAT)
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSending(true);
        setMessages((prev) => [...prev, { sender: "user", text: `📸 Subiendo y analizando: ${file.name}...` }]);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = async () => {
                // Compresión rápida por Canvas (Anti-timeout)
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

                    // Actualizamos la estructura de la página principal automáticamente
                    if (data.structure && data.structure.parts) {
                        onUpdateStructure(data.structure.parts);
                        setMessages((prev) => [...prev, {
                            sender: "ai",
                            text: `¡Listo, varón! He detectado la canción "${data.detected_name || 'Estructura Escaneada'}". Ya inyecté las estrofas y los acordes en tu pantalla principal.`
                        }]);
                        notify.success("Cifrado acoplado desde el Chatbot.");
                    }
                } catch (err: any) {
                    setMessages((prev) => [...prev, { sender: "ai", text: `❌ Error: ${err.message || 'No pude procesar esa imagen.'}` }]);
                } finally {
                    setSending(false);
                }
            };
        };
    };

    return (
        <div className="w-85 h-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-slate-950 p-3 border-b border-slate-800 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-100 uppercase tracking-tight">Asistente Multimodal v2</span>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Visión Artificial Conectada</span>
                </div>
                <button onClick={closeChat} className="text-slate-500 hover:text-slate-300 text-sm font-bold">✕</button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 bg-slate-900/40">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed font-medium ${msg.sender === "user"
                                ? "bg-indigo-600 text-slate-100 rounded-tr-none"
                                : "bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-none"
                            }`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Formulario con Clip Multimodal */}
            <form onSubmit={handleSendMessage} className="p-2 bg-slate-950 border-t border-slate-800 flex gap-2 items-center">
                <button
                    type="button"
                    disabled={sending}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
                    title="Subir foto de partitura"
                >
                    📎
                </button>
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
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-slate-900 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                    disabled={sending}
                />
                <button
                    type="submit"
                    disabled={sending}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-xs font-black uppercase rounded-lg transition-colors"
                >
                    {sending ? "..." : "Enviar"}
                </button>
            </form>
        </div>
    );
}
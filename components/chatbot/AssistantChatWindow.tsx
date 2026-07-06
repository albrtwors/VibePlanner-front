"use client";
import { useState, useRef, useEffect } from "react";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface Message {
    sender: "user" | "bot";
    text: string;
}

interface AssistantChatWindowProps {
    closeChat: () => void;
    // Tipado robustecido para incluir la metadata del presupuesto e invitados calculados por la IA
    onApplyExtractedData: (data: {
        itinerary: any[];
        staff: any[];
        inventory: any[];
        guests_count?: number;
        total_estimated_logistic_cost?: number;
        budget_projections?: any[];
    }) => void;
    currentGuestsCount: number; // Sincronización nativa con el aforo actual (CSV/Manual)
}

export default function AssistantChatWindow({ closeChat, onApplyExtractedData, currentGuestsCount }: AssistantChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([
        { sender: "bot", text: "¡Epa, varón! Soy tu asistente de producción. Dime qué necesitas acoplar al evento (canciones, personal técnico o insumos de bodega) y yo me encargo del volcado." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!input.trim()) return;

        const userText = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setLoading(true);

        try {
            const res = await fetch(`${endpoint}api/assistant/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Seteamos el aforo actual para que el LLM/Agente calcule presupuestos dinámicos en caliente
                body: JSON.stringify({
                    message: userText,
                    current_guests_count: currentGuestsCount
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error al procesar el dictado.");

            // Mostrar respuesta textual del bot
            setMessages((prev) => [...prev, { sender: "bot", text: data.message || "Procesado correctamente." }]);

            // Si el backend logró extraer formularios/entidades/presupuestos válidos, las volcamos al layout
            if (data.extracted_data) {
                onApplyExtractedData(data.extracted_data);
            }

        } catch (error: any) {
            console.error(error);
            setMessages((prev) => [...prev, { sender: "bot", text: "Disculpa, varón. Hubo un fallo interno procesando ese requerimiento." }]);
            notify.error(error.message || "Fallo de comunicación con el asistente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100">
            {/* Cabecera de la Ventana */}
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">Asistente de Production</span>
                </div>
                <button
                    onClick={closeChat}
                    className="p-1 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-slate-200 transition-all"
                >
                    ✕
                </button>
            </div>

            {/* Zona de Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex flex-col max-w-[85%] gap-1 text-xs font-bold leading-relaxed rounded-xl px-3 py-2.5 ${msg.sender === "user"
                            ? "bg-indigo-600 text-white self-end rounded-tr-none"
                            : "bg-slate-950 border border-slate-800 text-slate-300 self-start rounded-tl-none"
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}

                {/* Esqueleto de Carga / Bot Pensando */}
                {loading && (
                    <div className="bg-slate-950 border border-slate-800 text-slate-400 self-start rounded-xl rounded-tl-none px-3 py-2.5 max-w-[85%] flex items-center gap-1.5 text-xs font-black animate-pulse">
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-300" />
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Formulario de Entrada */}
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-slate-800/80 flex gap-2 shrink-0">
                <input
                    type="text"
                    placeholder="Ej: Calcula el banquete a $5 por persona..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-slate-700 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="px-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-lg transition-all active:scale-95 whitespace-nowrap"
                >
                    Enviar
                </button>
            </form>
        </div>
    );
}
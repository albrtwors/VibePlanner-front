// components/chatbot/InventoryChatAssistant.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface AIItemPayload {
    name: string;
    category: string;
    total_stock: number;
    unit_of_measure: string;
    is_consumable: boolean;
    price_per_unit: number; // Campo sincronizado
}

interface Message {
    sender: "user" | "bot";
    text: string;
    extractedItems?: AIItemPayload[]; // Guardamos los datos puros aquí
}

interface InventoryChatAssistantProps {
    closeChat: () => void;
    onAutofillForm: (item: AIItemPayload) => void;
}

export default function InventoryChatAssistant({ closeChat, onAutofillForm }: InventoryChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "bot",
            text: "¡Buenas! Escríbeme qué equipos o consumibles llegaron a la bodega. Puedo procesarlos en lote o darte las tarjetas estructuradas para rellenar tu formulario actual."
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
            const res = await fetch(`${endpoint}api/inventory/upload-ia`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userText })
            });

            const data = await res.json();
            if (res.ok) {
                // Capturamos la lista total estructurada que devolvió Flask
                const extracted = data.raw_extracted || [];

                setMessages((prev) => [
                    ...prev,
                    {
                        sender: "bot",
                        text: data.ai_summary || `Se procesaron ${extracted.length} artículos con éxito en el sistema central.`,
                        extractedItems: extracted // Guardamos la data real extraída por el LLM
                    }
                ]);
                notify.success("¡Análisis logístico de IA completado!");
            } else {
                throw new Error(data.error);
            }
        } catch (err: any) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: err.message || "Problema de comunicación con el motor logístico IA." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-h-[75vh] min-h-[420px] bg-slate-950 text-slate-100 font-medium overflow-hidden rounded-xl border border-slate-800 shadow-2xl">
            {/* Header */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800/80 flex justify-between items-center shrink-0 z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <div>
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-100">Asistente de Bodega IA</h3>
                        <p className="text-[9px] font-bold text-indigo-400 tracking-wide">Procesador de Insumos</p>
                    </div>
                </div>
                <button onClick={closeChat} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar bg-gradient-to-b from-slate-950 to-slate-900/40">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex flex-col max-w-[92%] ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>
                        <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed font-semibold shadow-sm ${msg.sender === "user"
                            ? "bg-indigo-600 text-white rounded-tr-none font-bold"
                            : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                            }`}>
                            {msg.text}
                        </div>

                        {/* RENDERIZADO ACCIONES DINÁMICAS BASADAS EN LOS ITEMS REALES DE LA IA */}
                        {msg.sender === "bot" && msg.extractedItems && msg.extractedItems.length > 0 && (
                            <div className="mt-2 w-full min-w-[260px] bg-slate-900 border border-slate-800/90 rounded-xl p-2 flex flex-col gap-2 shadow-xl">
                                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider px-1">
                                    📋 Items Detectados ({msg.extractedItems.length})
                                </span>

                                <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                    {msg.extractedItems.map((item, itemIdx) => (
                                        <div key={itemIdx} className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex flex-col gap-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <span className="text-[10px] font-bold text-slate-200 truncate max-w-[150px]">{item.name}</span>
                                                <span className="text-[9px] font-mono font-bold text-emerald-400 shrink-0">${item.price_per_unit}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[8px] text-slate-500 font-bold uppercase tracking-wide">
                                                <span>{item.category} • {item.is_consumable ? "Gastable" : "Fijo"}</span>
                                                <span className="font-mono text-indigo-400">{item.total_stock} {item.unit_of_measure}</span>
                                            </div>
                                            <button
                                                onClick={() => onAutofillForm(item)}
                                                className="w-full mt-1 py-1 bg-indigo-600/10 hover:bg-indigo-600 border border-indigo-500/20 text-indigo-400 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-md transition-all duration-150"
                                            >
                                                ✍️ Rellenar Formulario con este item
                                            </button>
                                        </div>
                                    ))}
                                </div>
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

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-2.5 bg-slate-900 border-t border-slate-800/80 flex gap-2 shrink-0 z-10">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ej: Llegaron 5 Consolas Behringer X32 de 200 dólares..."
                    disabled={isLoading}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 text-[11px] px-3 py-2 rounded-lg text-slate-100 placeholder-slate-500 font-bold focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
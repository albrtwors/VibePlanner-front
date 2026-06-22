// app/chatbot/page.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";

interface Message {
    sender: "user" | "bot";
    text: string;
}

export default function ChatbotPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            sender: "bot",
            text: "Hola. Soy el asistente de operaciones de VibePlanner. Puedo darte instrucciones de uso, indicarte las rutas de los módulos o listarte las canciones e inventarios disponibles. ¿En qué puedo ayudarte?",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setInput("");
        setMessages((prev) => [...prev, { sender: "user", text: userText }]);
        setLoading(true);

        try {
            const res = await fetch(`${endpoint}api/chatbot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userText }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Fallo en la comunicación.");

            setMessages((prev) => [...prev, { sender: "bot", text: data.response }]);
        } catch (error: any) {
            notify.error(error.message || "Error al conectar con el servidor.");
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Hubo un problema de conexión con el servicio de asistencia." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 font-medium text-slate-100 flex flex-col h-[calc(100vh-4rem)] gap-4">

            <div className="border-b border-slate-800 pb-3">
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-100 sm:text-2xl">
                    Asistente de Operaciones
                </h1>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">
                    Documentación logística y consulta de estado de base de datos en tiempo real
                </p>
            </div>

            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">

                {/* Panel de Conversación */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                            <div
                                className={`max-w-[90%] rounded-xl px-4 py-2.5 text-xs leading-relaxed shadow-md ${msg.sender === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none font-bold"
                                        : "bg-slate-950 border border-slate-800 text-slate-300 rounded-tl-none prose prose-invert max-w-none"
                                    }`}
                            >
                                {msg.sender === "bot" ? (
                                    <ReactMarkdown
                                        components={{
                                            // Interceptamos las etiquetas de enlaces estándar generadas por Markdown
                                            a: ({ href, children }) => {
                                                const url = href || "";
                                                // Excluir la ruta /file para que no cree un componente Link interactivo
                                                if (url.includes("/file")) {
                                                    return <span className="text-indigo-400 font-bold">{children}</span>;
                                                }
                                                return (
                                                    <Link
                                                        href={url}
                                                        className="text-indigo-400 hover:text-indigo-300 font-bold underline transition-colors"
                                                    >
                                                        {children}
                                                    </Link>
                                                );
                                            },
                                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                            li: ({ children }) => <li className="list-disc list-inside mb-1">{children}</li>,
                                            table: ({ children }) => <div className="overflow-x-auto my-2"><table className="w-full border-collapse border border-slate-800 text-left text-[11px]">{children}</table></div>,
                                            th: ({ children }) => <th className="bg-slate-900 border border-slate-800 p-2 font-bold text-slate-200">{children}</th>,
                                            td: ({ children }) => <td className="border border-slate-800 p-2 text-slate-400">{children}</td>,
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                ) : (
                                    msg.text
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-950 border border-slate-800 rounded-xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
                                    Consultando Base de Datos e IA...
                                </span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Consúltame rutas o solicita listados, ej: '¿Qué canciones tengo registradas?'"
                        disabled={loading}
                        className="flex-1 bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-2 text-xs font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-500"
                    />
                    <button
                        type="submit"
                        disabled={loading || !input.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider px-4 py-2 rounded-lg transition-all disabled:opacity-40"
                    >
                        Enviar
                    </button>
                </form>

            </div>
        </div>
    );
}
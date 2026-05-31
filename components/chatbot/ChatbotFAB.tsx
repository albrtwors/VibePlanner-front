// components/chatbot/ChatBotFAB.tsx
"use client";
import { useState, ReactNode } from "react";

interface ChatBotFABProps {
    children: (props: { closeChat: () => void }) => ReactNode;
}

export default function ChatBotFAB({ children }: ChatBotFABProps) {
    const [isOpen, setIsOpen] = useState(false);

    const closeChat = () => setIsOpen(false);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 select-none">
            {/* Ventana flotante (Renderiza el children si está abierto) */}
            {isOpen && (
                <div className="w-[360px] sm:w-[420px] h-[550px] bg-slate-900/95 border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-8 zoom-in-95 duration-200">
                    {children({ closeChat })}
                </div>
            )}

            {/* Botón de Acción Flotante (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-slate-100 shadow-xl transition-all duration-300 relative group active:scale-95 ${isOpen
                    ? "bg-slate-800 hover:bg-slate-700 rotate-90"
                    : "bg-gradient-to-tr from-indigo-600 to-violet-500 hover:from-indigo-500 hover:to-violet-400 hover:scale-105 shadow-indigo-500/20"
                    }`}
                title={isOpen ? "Cerrar Asistente" : "Abrir Asistente AI"}
            >
                {/* Ping de notificación animado cuando está cerrado */}
                {!isOpen && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
                )}

                {isOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
// components/cards/EventCard.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface EventCardProps {
    id: number;
    name: string;
    date: string;
    time: string;
    targetAudience: string;
    staffCount: number;
    inventoryCount: number;
    onDelete: () => void;
}

export default function EventCard({
    id,
    name,
    date,
    time,
    targetAudience,
    staffCount,
    inventoryCount,
    onDelete
}: EventCardProps) {
    const [mounted, setMounted] = useState(false);

    // Esperar a que se monte en el cliente para aplicar toLocaleDateString de forma segura
    useEffect(() => {
        setMounted(true);
    }, []);

    // Formatear la fecha evitando discrepancias SSR/Cliente
    const formattedDate = mounted
        ? new Date(date + "T00:00:00").toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })
        : date; // Fallback plano temporal en lo que hidrata el DOM

    return (
        <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center p-4 bg-slate-900 border border-slate-800/80 hover:border-slate-700/60 rounded-xl transition-all gap-4 group hover:shadow-lg hover:shadow-black/20 overflow-hidden">

            {/* Información Principal del Evento con control estricto de ancho mínimo */}
            <div className="flex items-start gap-3 w-full min-w-0 flex-1">
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl shrink-0 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>

                {/* Contenedor con min-w-0 para forzar el truncamiento del texto interno */}
                <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <Link
                        href={`/events/${id}`}
                        className="font-bold text-slate-100 hover:text-indigo-400 text-sm sm:text-base transition-colors truncate block pr-2"
                        title={name} // Tooltip nativo al pasar el mouse si se corta
                    >
                        {name}
                    </Link>

                    {/* MetaData Fluida: Ajustado para romper líneas en pantallas compactas sin desbordar */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-400 font-semibold min-w-0 w-full">
                        <span className="text-indigo-400 font-bold shrink-0">
                            {formattedDate} — {time ? time.slice(0, 5) : "00:00"}
                        </span>

                        <span className="text-slate-700 hidden sm:inline">•</span>

                        <span className="px-2 py-0.5 bg-slate-950 border border-slate-800/60 rounded-md text-[9px] uppercase font-black tracking-wider text-slate-300 max-w-[120px] truncate shrink-0">
                            {targetAudience}
                        </span>

                        <span className="text-slate-700">•</span>

                        <span className="text-slate-400 text-[11px] whitespace-nowrap">👤 {staffCount} Staff</span>

                        <span className="text-slate-700">•</span>

                        <span className="text-slate-400 text-[11px] whitespace-nowrap">📦 {inventoryCount} Ítems</span>
                    </div>
                </div>
            </div>

            {/* Caja de Acciones de Control Flotante/Alineada */}
            <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto justify-end border-t border-slate-800/40 md:border-none pt-3 md:pt-0">
                <Link href={`/events/${id}/edit`} className="shrink-0">
                    <button className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-slate-100 text-xs font-bold rounded-lg transition-all active:scale-95">
                        Editar
                    </button>
                </Link>
                <button
                    onClick={onDelete}
                    className="p-1.5 bg-red-600/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg transition-all active:scale-95 shrink-0"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-14v4M1 7h22" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
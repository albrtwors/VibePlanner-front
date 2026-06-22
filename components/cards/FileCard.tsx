// components/cards/FileCard.tsx
"use client";
import Link from "next/link";

interface FileCardProps {
    id: number;
    name: string;
    tematica: string | null;
    songsCount: number;
    createdAt: string;
    onDelete: () => void;
}

export default function FileCard({ id, name, tematica, songsCount, createdAt, onDelete }: FileCardProps) {
    // Formatear la fecha ISO que viene de Flask a algo legible
    const formattedDate = new Date(createdAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-indigo-500/30 hover:bg-indigo-600/5 transition-all backdrop-blur-sm group/card">

            {/* Toda la zona de contenido ahora redirige al Detalle de la página */}
            <Link href={`/files/${id}`} className="flex items-start gap-4 flex-1 min-w-0 w-full cursor-pointer">
                {/* Icono de Carpeta/Cancionero */}
                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400 group-hover/card:bg-indigo-500/20 group-hover/card:text-indigo-300 transition-all shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                </div>

                <div className="flex flex-col gap-1 min-w-0 w-full">
                    <h3 className="font-bold text-slate-100 tracking-tight text-base truncate group-hover/card:text-indigo-400 transition-colors">
                        {name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                        {tematica && (
                            <span className="text-slate-300 italic truncate max-w-[250px]">
                                🎯 {tematica}
                            </span>
                        )}
                        <span className="flex items-center gap-1 text-slate-500">
                            📁 {songsCount} {songsCount === 1 ? "canción" : "canciones"}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-500">🕒 {formattedDate}</span>
                    </div>
                </div>
            </Link>

            {/* Botones de Acción (Se mantiene aislado para que el onClick de borrar no interfiera con el Link) */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                {/* Botón de acceso rápido para Editar/Reorganizar directo */}
                <Link href={`/files/${id}/edit`} className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all" title="Editar u ordenar repertorio">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </Link>

                <button
                    onClick={(e) => {
                        e.preventDefault(); // Evita cualquier comportamiento extraño de propagación
                        onDelete();
                    }}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                    title="Eliminar repertorio"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
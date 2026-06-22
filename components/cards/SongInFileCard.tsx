// components/cards/SongInFileDetailCard.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import SongStructureViewer from "@/components/songs/SongStructureViewer";

interface SongInFileDetailCardProps {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
    position: number;
    structure: any; // El objeto JSON parseado de la estructura
}

export default function SongInFileDetailCard({ id, name, author, genre, position, structure }: SongInFileDetailCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Tarjeta clicable */}
            <div
                onClick={() => setIsOpen(true)}
                className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl hover:border-indigo-500/40 hover:bg-indigo-600/5 cursor-pointer transition-all group backdrop-blur-sm"
            >
                <div className="flex items-center gap-4 min-w-0">
                    {/* Indicador de posición en el setlist */}
                    <span className="flex items-center justify-center w-7 h-7 bg-slate-950 border border-slate-800 text-xs font-black text-indigo-400 rounded-lg group-hover:border-indigo-500/30 shrink-0 select-none">
                        {position}
                    </span>

                    <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-100 truncate group-hover:text-indigo-400 transition-colors">
                            {name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">
                            👤 {author || "Autor Desconocido"} {genre ? `• 🏷️ ${genre}` : ""}
                        </p>
                    </div>
                </div>

                {/* Acciones directas (Botón para ver el link completo de la canción) */}
                <div className="shrink-0 pl-2" onClick={(e) => e.stopPropagation()}>
                    <Link
                        href={`/songs/${id}`}
                        className="p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center gap-1.5 text-xs font-medium"
                        title="Ir al detalle completo de la canción"
                    >
                        <span>Ver canción</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Modal de la Estructura */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-indigo-500/30 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden">

                        {/* Header del Modal */}
                        <div className="p-5 border-b border-slate-800/80 flex justify-between items-start bg-slate-950/20">
                            <div>
                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Estructura • Canción N° {position}</span>
                                <h3 className="text-xl font-black text-slate-100 tracking-tight mt-0.5">{name}</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{author || "Autor Desconocido"}</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-xl transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Cuerpo con Scroll para ver el visor */}
                        <div className="p-6 overflow-y-auto bg-slate-950/40 flex-1">
                            {structure ? (
                                <SongStructureViewer structure={structure} />
                            ) : (
                                <div className="text-center py-12 text-sm text-slate-500 italic">
                                    Esta canción no tiene una estructura o itinerario registrado.
                                </div>
                            )}
                        </div>

                        {/* Footer del Modal */}
                        <div className="p-4 border-t border-slate-800/60 flex justify-end gap-3 bg-slate-950/20">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
                            >
                                Cerrar Vista
                            </button>
                            <Link href={`/songs/${id}`} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-slate-100 text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5">
                                Ver Todo
                            </Link>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}
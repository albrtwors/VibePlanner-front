// components/cards/SongCard.tsx
"use client";
import Link from "next/link";

interface SongCardProps {
    id: number;
    title: string;
    artist: string;
    genre?: string;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function SongCard({ id, title, artist, genre, onEdit, onDelete }: SongCardProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800/80 rounded-xl hover:border-slate-700/60 transition-all shadow-sm group">

            {/* Información de la Canción */}
            <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                    {title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">{artist}</span>
                    {genre && (
                        <>
                            <span className="text-slate-600">•</span>
                            <span className="px-2 py-0.5 bg-slate-800 border border-slate-700/50 rounded-full text-slate-400">
                                {genre}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Ver Detalle */}
                <Link
                    href={`/songs/${id}`}
                    className="p-2 text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                    title="Ver detalle"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </Link>

                {/* Editar */}
                {onEdit && (
                    <button
                        onClick={onEdit}
                        className="p-2 text-slate-400 hover:text-indigo-400 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                        title="Editar canción"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                )}

                {/* Eliminar */}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-2 text-slate-400 hover:text-red-400 bg-slate-950 border border-slate-800 rounded-lg transition-colors"
                        title="Eliminar canción"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

        </div>
    );
}
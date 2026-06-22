// app/files/[id]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";

import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";
import SongInFileDetailCard from "@/components/cards/SongInFileCard";

interface DetailedSong {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
    position: number;
    structure?: any;
}

interface FileDetail {
    id: number;
    name: string;
    tematica: string | null;
    created_at: string;
    songs: DetailedSong[];
}

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Desempaquetamos los params usando unwrap nativo de Next 15
    const { id } = use(params);

    const [fileData, setFileData] = useState<FileDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFileDetail = async () => {
            try {
                const res = await fetch(`${endpoint}api/files/${id}`);
                if (!res.ok) throw new Error("No se pudo obtener la información del cancionero.");

                const data = await res.json();
                setFileData(data);
            } catch (error) {
                console.error(error);
                notify.error("Ocurrió un problema cargando el setlist.");
            } finally {
                setLoading(false);
            }
        };

        fetchFileDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-24 text-center text-sm text-slate-500 animate-pulse">
                Cargando orden y detalles del cancionero...
            </div>
        );
    }

    if (!fileData) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                <p className="text-slate-400 text-sm">El cancionero solicitado no existe o fue removido.</p>
                <Link href="/files" className="text-indigo-400 text-sm hover:underline mt-4 inline-block">
                    Volver a los cancioneros
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24">
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">
                {/* Cabecera / Navegación */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/files" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-100 tracking-tight sm:text-3xl">
                                {fileData.name}
                            </h1>
                            {fileData.tematica && (
                                <p className="text-sm text-slate-400 italic mt-0.5">
                                    🎯 Temática: {fileData.tematica}
                                </p>
                            )}
                        </div>
                    </div>

                    <Link href={`/files/edit/${fileData.id}`} className="shrink-0">
                        <button className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-indigo-400 transition-all flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Reorganizar Setlist
                        </button>
                    </Link>
                </div>

                {/* Listado Secuencial de Canciones */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                        <span>Orden de Ejecución ({fileData.songs.length})</span>
                        <span>Ficha Técnica</span>
                    </div>

                    {fileData.songs.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-sm text-slate-500">
                            Este cancionero aún no tiene canciones cargadas en su repertorio.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {fileData.songs.map((song) => (
                                <SongInFileDetailCard
                                    key={song.id}
                                    id={song.id}
                                    name={song.name}
                                    author={song.author}
                                    genre={song.genre}
                                    position={song.position}
                                    structure={song.structure} // Le pasamos la estructura para que la levante el modal
                                />
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
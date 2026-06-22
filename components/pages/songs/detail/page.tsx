// app/songs/[id]/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";
import SongStructureViewer from "@/components/songs/SongStructureViewer";

interface SongDetail {
    id: number;
    name: string;
    structure: {
        parts: Array<{ title: string; content: string }>;
    };
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function SongDetailPage({ params }: PageProps) {
    // Desempaquetamos los params usando use() para evitar warnings en Next.js
    const { id } = use(params);

    const [song, setSong] = useState<SongDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSongDetail = async () => {
            try {
                const res = await fetch(`${endpoint}api/songs/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("La canción no existe");
                    throw new Error("Error en el servidor");
                }
                const data = await res.json();
                setSong(data);
            } catch (error: any) {
                console.error(error);
                notify.error(error.message || "No se pudo cargar el detalle de la canción.");
            } finally {
                setLoading(false);
            }
        };

        fetchSongDetail();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <div className="text-sm text-slate-500 animate-pulse">
                    Cargando estructura musical...
                </div>
            </div>
        );
    }

    if (!song) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4">
                <p className="text-sm text-slate-400">No se encontró la canción solicitada.</p>
                <Link href="/songs" className="text-xs font-bold uppercase text-indigo-400 hover:underline">
                    Volver al repertorio
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30">
            {/* Efecto Blur de Fondo consistente con Create */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">

                {/* Header con botón para regresar */}
                <div className="flex items-center gap-5 border-b border-slate-800/80 pb-8">
                    <Link
                        href="/songs"
                        className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all"
                        title="Volver a la lista"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Detalle de Canción</span>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 mt-0.5">
                            {song.name}
                        </h1>
                    </div>
                </div>

                {/* Visor de la Estructura (Partes, acordes/letras de la IA) */}
                <div className="bg-slate-900/10 rounded-2xl border border-slate-800/50 backdrop-blur-md p-2">
                    {song.structure && song.structure.parts && song.structure.parts.length > 0 ? (
                        <SongStructureViewer structure={song.structure} />
                    ) : (
                        <div className="text-center py-12 text-sm text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                            Esta canción no cuenta con un itinerario o estructura guardada.
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
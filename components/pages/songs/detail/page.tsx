"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Music4, HelpCircle } from "lucide-react"; // Cambiamos el SVG a Lucide para un look consistente
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

// Variantes de animación para la entrada limpia de los bloques de la página
const pageVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 100, damping: 15 }
    }
};

export default function SongDetailPage({ params }: PageProps) {
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

    // LECTURA DE CARGA (Skeleton interactivo estilizado)
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
                <div className="max-w-4xl w-full mx-auto px-4 flex flex-col gap-8 animate-pulse">
                    <div className="flex items-center gap-5 pb-8 border-b border-slate-900">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-28 bg-slate-900 rounded" />
                            <div className="h-7 w-64 bg-slate-900 rounded-lg" />
                        </div>
                    </div>
                    <div className="h-96 w-full bg-slate-900/40 border border-slate-900 rounded-2xl" />
                </div>
            </div>
        );
    }

    // CASO EXCEPCIONAL: CANCIÓN NO ENCONTRADA
    if (!song) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center max-w-sm gap-4"
                >
                    <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 mb-2">
                        <HelpCircle className="w-6 h-6" />
                    </div>
                    <p className="text-sm text-slate-400">No pudimos localizar la estructura de la canción solicitada en VibePlanner.</p>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Link href="/songs" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2.5 rounded-xl border border-indigo-500/20 transition-colors">
                            <ArrowLeft className="w-4 h-4" /> Volver al repertorio
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Efectos Blur de Fondo Fluido */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">

                {/* Header Animado */}
                <motion.div

                    initial="hidden"
                    animate="visible"
                    className="flex items-center justify-between border-b border-slate-800/80 pb-8"
                >
                    <div className="flex items-center gap-5">
                        <motion.div whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}>
                            <Link
                                href="/songs"
                                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-slate-700 transition-colors block"
                                title="Volver a la lista"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </motion.div>
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Music4 className="w-3.5 h-3.5 text-indigo-500/70" /> Detalle de Canción
                            </span>
                            <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 mt-1">
                                {song.name}
                            </h1>
                        </div>
                    </div>
                </motion.div>

                {/* Contenedor del Visor Animado con delay sutil */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}
                    className="bg-slate-900/10 rounded-2xl border border-slate-800/50 backdrop-blur-md p-2 shadow-xl shadow-black/20"
                >
                    {song.structure && song.structure.parts && song.structure.parts.length > 0 ? (
                        <SongStructureViewer structure={song.structure} />
                    ) : (
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-center py-16 text-sm text-slate-500 bg-slate-900/20 rounded-xl border border-dashed border-slate-800/80 my-2 mx-2"
                        >
                            Esta canción no cuenta con un itinerario o estructura guardada en la base de datos.
                        </motion.div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}
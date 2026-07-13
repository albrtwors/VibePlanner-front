"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Music, Trash2, Edit3, Loader2 } from "lucide-react";
import GenericButton from "@/components/buttons/GenericButton";
import SongCard from "@/components/cards/SongCard";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface Song {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
}

// Variantes de animación para el contenedor de la lista (Efecto Stagger/Cascada)
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

export default function SongsIndex() {
    const [search, setSearch] = useState("");
    const [songs, setSongs] = useState<Song[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search.trim() !== "") {
                queryParams.append("name", search);
                queryParams.append("author", search);
                queryParams.append("genre", search);
            }

            const res = await fetch(`${endpoint}api/songs/?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Error en la petición");

            const data = await res.json();
            setSongs(data.songs || []);
        } catch (error) {
            console.error(error);
            notify.error("No se pudieron cargar las canciones.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchSongs();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    const handleDelete = async (id: number, name: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la canción "${name}"?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${endpoint}api/songs/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("No se pudo eliminar la canción del servidor.");

            setSongs((prevSongs) => prevSongs.filter((song) => song.id !== id));
            notify.success(`Canción "${name}" eliminada con éxito.`);
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "Ocurrió un error al intentar eliminar la canción.");
        }
    };

    return (
        <div className="relative max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 text-white overflow-hidden">
            {/* Luces de fondo consistentes con la estética de VibePlanner */}
            <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-indigo-500/5 blur-[100px]" />
            <div className="absolute bottom-1/4 left-1/4 -z-10 h-64 w-64 rounded-full bg-pink-500/5 blur-[100px]" />

            {/* Encabezado Animado de entrada */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-2 border-b border-slate-800/60 pb-6"
            >
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Gestión de Canciones
                </h1>
                <p className="text-base text-slate-400 max-w-2xl">
                    Aquí podrás crear, editar y organizar el repertorio musical para tus próximos eventos de logística.
                </p>
            </motion.div>

            {/* Barra de Filtros y Acción Principal con Efecto Glassmorphism */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-lg"
            >
                <div className="relative flex-1 max-w-md group">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por título, artista o género..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-slate-950 transition-all duration-300 text-sm"
                    />
                </div>

                <Link href="/songs/create">
                    <motion.div
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full"
                    >
                        <GenericButton color="primary">
                            <span className="flex items-center gap-1.5 justify-center">
                                <Plus className="w-4 h-4" /> Nueva Canción
                            </span>
                        </GenericButton>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Lista de Contenido Reactiva */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-2">
                    <span>Lista de canciones ({songs.length})</span>
                    <span>Acciones</span>
                </div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20 gap-3 text-sm text-slate-400"
                        >
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            <span>Sincronizando repertorio con Flask...</span>
                        </motion.div>
                    ) : songs.length === 0 ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-16 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl text-sm text-slate-500 gap-2"
                        >
                            <Music className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                            <p>No se encontraron pistas en este cuadrante.</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            variants={containerVariants}
                            initial="hidden"
                            animate="show"
                            className="flex flex-col gap-3"
                        >
                            {songs.map((song) => (
                                <motion.div
                                    key={song.id}

                                    layout // Anima la re-organización física de la lista automáticamente si una cambia
                                    exit="exit"
                                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                    className="relative group rounded-xl overflow-hidden"
                                >
                                    <SongCard
                                        id={song.id}
                                        title={song.name}
                                        artist={song.author || "Autor Desconocido"}
                                        genre={song.genre || undefined}
                                        onEdit={() => notify.success(`Abriendo editor para: ${song.name}`)}
                                        onDelete={() => handleDelete(song.id, song.name)}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
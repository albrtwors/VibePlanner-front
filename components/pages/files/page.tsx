"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, FolderKanban, Loader2, Inbox } from "lucide-react";
import GenericButton from "@/components/buttons/GenericButton";
import FileCard from "@/components/cards/FileCard";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface FileRepertoire {
    id: number;
    name: string;
    tematica: string | null;
    songs_count: number;
    created_at: string;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
};

const cardVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    exit: {
        opacity: 0,
        x: -20,
        scale: 0.95,
        transition: { duration: 0.2 }
    }
};

export default function FilesIndex() {
    const [search, setSearch] = useState("");
    const [files, setFiles] = useState<FileRepertoire[]>([]);
    const [loading, setLoading] = useState(true);

    // Carga los repertorios aplicando filtros dinámicos
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search.trim() !== "") {
                queryParams.append("name", search);
                queryParams.append("tematica", search);
            }

            const res = await fetch(`${endpoint}api/files/?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Error en la petición de cancioneros");

            const data = await res.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error(error);
            notify.error("No se pudieron cargar los cancioneros.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchFiles();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    // Eliminar el repertorio físico
    const handleDelete = async (id: number, name: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar el cancionero "${name}"?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${endpoint}api/files/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("No se pudo eliminar el cancionero del servidor.");

            setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
            notify.success(`Cancionero "${name}" eliminado con éxito.`);
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "Ocurrió un error al intentar eliminar el cancionero.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-12 flex flex-col gap-8 overflow-x-hidden selection:bg-indigo-500/30">

            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-2 border-b border-slate-800/60 pb-6"
            >
                <h1 className="text-3xl font-black text-slate-100 tracking-tight sm:text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 flex items-center gap-3">
                    <FolderKanban className="w-8 h-8 text-indigo-400 shrink-0" /> Gestión de Cancioneros
                </h1>
                <p className="text-sm font-medium text-slate-400 max-w-2xl leading-relaxed">
                    Crea, estructura y define el orden de tus canciones agrupadas por eventos o temáticas específicas de forma interactiva.
                </p>
            </motion.div>

            {/* Barra de Filtros */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/30 backdrop-blur-sm p-4 rounded-xl border border-slate-800/80 shadow-lg"
            >
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar cancionero por nombre o temática..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium duration-300"
                    />
                </div>

                <Link href="/files/create" className="shrink-0">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <GenericButton color="primary">
                            <span className="flex items-center gap-1.5 font-black uppercase text-xs tracking-wider">
                                <Plus className="w-4 h-4" /> Nuevo Cancionero
                            </span>
                        </GenericButton>
                    </motion.div>
                </Link>
            </motion.div>

            {/* Listado Reactivo */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-black text-slate-500 uppercase tracking-widest px-2 select-none">
                    <span>Lista de Cancioneros ({files.length})</span>
                    <span>Acciones</span>
                </div>

                <div className="relative min-h-[200px]">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {loading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-2 py-12 text-sm font-semibold text-indigo-400"
                            >
                                <Loader2 className="w-6 h-6 animate-spin" />
                                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Cargando cancioneros...</span>
                            </motion.div>
                        ) : files.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex flex-col items-center justify-center gap-3 py-14 bg-slate-900/10 border border-dashed border-slate-800 rounded-xl text-center"
                            >
                                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-600">
                                    <Inbox className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-medium text-slate-500 max-w-xs">
                                    No se encontraron cancioneros creados. ¡Arma el primero usando el botón de arriba, mano!
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                className="grid grid-cols-1 gap-3"
                            >
                                {files.map((file) => (
                                    <motion.div
                                        key={file.id}

                                        layout
                                    >
                                        <FileCard
                                            id={file.id}
                                            name={file.name}
                                            tematica={file.tematica}
                                            songsCount={file.songs_count}
                                            createdAt={file.created_at}
                                            onDelete={() => handleDelete(file.id, file.name)}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

        </div>
    );
}
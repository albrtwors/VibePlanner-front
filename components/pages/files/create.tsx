"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Search, GripVertical, Trash2, Sparkles, Loader2, AlertCircle, Plus } from "lucide-react";
import Sortable from "sortablejs";
import GenericButton from "@/components/buttons/GenericButton";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import FileChatAssistant from "@/components/chatbot/FileChatAssistant";

interface SearchSong {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
}

interface SelectedSong extends SearchSong {
    uniqueId: string;
}

interface FormErrors {
    name?: string;
    tematica?: string;
}

const errorFadeVariant = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};

export default function CreateFilePage() {
    const router = useRouter();

    // Estados principales del Cancionero
    const [name, setName] = useState("");
    const [tematica, setTematica] = useState("");
    const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    // Estados del Buscador Integrado
    const [songSearch, setSongSearch] = useState("");
    const [searchResults, setSearchResults] = useState<SearchSong[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Referencias para SortableJS
    const sortableContainerRef = useRef<HTMLDivElement | null>(null);
    const sortableInstance = useRef<Sortable | null>(null);

    // 1. Buscador Reactivo de Canciones (Debounce) con Extracción Segura
    useEffect(() => {
        if (songSearch.trim() === "") {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${endpoint}api/songs/?name=${songSearch}`);
                if (res.ok) {
                    const data = await res.json();

                    // EXTRACCIÓN BLINDADA
                    if (data && typeof data === "object" && "songs" in data) {
                        setSearchResults(Array.isArray(data.songs) ? data.songs : []);
                    } else if (Array.isArray(data)) {
                        setSearchResults(data);
                    } else {
                        setSearchResults([]);
                    }
                }
            } catch (error) {
                console.error("Error buscando canciones:", error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [songSearch]);

    // 2. Inicialización de SortableJS con Animaciones Fluidas
    useEffect(() => {
        if (sortableContainerRef.current && selectedSongs.length > 0) {
            if (sortableInstance.current) {
                sortableInstance.current.destroy();
            }

            sortableInstance.current = Sortable.create(sortableContainerRef.current, {
                animation: 220,
                handle: ".drag-handle",
                ghostClass: "bg-indigo-600/10",
                chosenClass: "border-indigo-500/30",
                dragClass: "opacity-40",
                onEnd: () => {
                    if (!sortableContainerRef.current) return;

                    const updatedOrderIds = Array.from(
                        sortableContainerRef.current.children
                    ).map((el) => el.getAttribute("data-unique-id"));

                    setSelectedSongs((prev) => {
                        const sorted = [...prev];
                        sorted.sort((a, b) => {
                            return updatedOrderIds.indexOf(a.uniqueId) - updatedOrderIds.indexOf(b.uniqueId);
                        });
                        return sorted;
                    });
                },
            });
        }

        return () => {
            if (sortableInstance.current) {
                sortableInstance.current.destroy();
                sortableInstance.current = null;
            }
        };
    }, [selectedSongs.length]);

    const validateForm = (): boolean => {
        const localErrors: FormErrors = {};
        const hasNumbers = /\d/;

        if (!name.trim()) {
            localErrors.name = "El nombre del repertorio es obligatorio, varón.";
        } else if (name.trim().length < 3) {
            localErrors.name = "El nombre debe contener al menos 3 caracteres.";
        } else if (hasNumbers.test(name)) {
            localErrors.name = "El nombre del repertorio no puede contener números.";
        }

        if (tematica.trim()) {
            if (tematica.trim().length < 3) {
                localErrors.tematica = "La temática debe tener al menos 3 caracteres.";
            } else if (hasNumbers.test(tematica)) {
                localErrors.tematica = "La temática no puede contener números.";
            }
        }

        setErrors(localErrors);
        return Object.keys(localErrors).length === 0;
    };

    const handleAddSong = (song: SearchSong) => {
        const newSelected: SelectedSong = {
            ...song,
            uniqueId: `${song.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        };
        setSelectedSongs((prev) => [...prev, newSelected]);
        setSongSearch("");
        setSearchResults([]);
        notify.success(`"${song.name}" añadida al cancionero.`);
    };

    const handleRemoveSong = (uniqueId: string) => {
        setSelectedSongs((prev) => prev.filter((s) => s.uniqueId !== uniqueId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            notify.error("Corrige los campos marcados antes de guardar, mano.");
            return;
        }

        setIsSubmitting(true);

        const structuredSongsPayload = selectedSongs.map((song, index) => ({
            id: song.id,
            position: index + 1
        }));

        try {
            const response = await fetch(`${endpoint}api/files/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    tematica: tematica.trim() || null,
                    songs: structuredSongsPayload
                })
            });

            if (response.ok) {
                notify.success(`¡Cancionero "${name}" creado con éxito!`);
                router.push("/files");
                router.refresh();
            } else {
                notify.error("Error del servidor al guardar el cancionero.");
            }
        } catch (error) {
            notify.error("No se pudo conectar con el servidor de Flask.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30 overflow-x-hidden">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">

                {/* Header Animado */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-5 border-b border-slate-800/60 pb-8"
                >
                    <motion.div whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/files" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors block">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </motion.div>
                    <div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Logística de Eventos</span>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 mt-0.5">
                            Crear Nuevo Cancionero
                        </h1>
                    </div>
                </motion.div>

                {/* Formulario Principal */}
                <motion.form
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-6 sm:p-10 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl"
                >
                    {/* INPUT NOMBRE */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-0.5">Nombre del Repertorio / Evento <span className="text-indigo-400">*</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Concierto Acústico Central"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-slate-200 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.name ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.name && (
                                <motion.p variants={errorFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* INPUT TEMÁTICA */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-0.5">Temática <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Baladas de los 80, Setlist de boda..."
                            value={tematica}
                            onChange={(e) => setTematica(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-slate-200 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.tematica ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.tematica && (
                                <motion.p variants={errorFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> {errors.tematica}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Buscador de canciones en vivo */}
                    <div className="flex flex-col gap-2 md:col-span-2 border-t border-slate-800/40 pt-5 relative">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-0.5">Buscar y Añadir Canciones</label>
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Escribe el nombre de la canción o artista..."
                                value={songSearch}
                                onChange={(e) => setSongSearch(e.target.value)}
                                className="w-full pl-11 pr-10 p-3 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                            />
                            <Search className="w-4 h-4 text-slate-500 absolute left-4 top-4 group-focus-within:text-indigo-400 transition-colors" />
                            {isSearching && (
                                <Loader2 className="absolute right-4 top-3.5 w-4 h-4 text-indigo-400 animate-spin" />
                            )}
                        </div>

                        {/* Dropdown de Resultados flotante con AnimatePresence */}
                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute left-0 top-[92px] w-full max-h-60 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto z-50 shadow-2xl divide-y divide-slate-800/40 backdrop-blur-xl custom-scrollbar"
                                >
                                    {searchResults.map((song) => (
                                        <div
                                            key={song.id}
                                            onClick={() => handleAddSong(song)}
                                            className="p-3 flex justify-between items-center hover:bg-indigo-600/10 cursor-pointer transition-colors rounded-lg mx-1 group"
                                        >
                                            <div className="min-w-0 pr-4">
                                                <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{song.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{song.author || "Sin autor"} • <span className="text-slate-500">{song.genre || "Sin género"}</span></p>
                                            </div>
                                            <span className="shrink-0 text-[11px] font-black uppercase tracking-wider bg-slate-950 px-2.5 py-1.5 border border-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all flex items-center gap-1">
                                                <Plus className="w-3 h-3" /> Añadir
                                            </span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Contenedor del orden con Sortable.js */}
                    <div className="flex flex-col gap-3 md:col-span-2 mt-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-0.5 flex items-center gap-2">
                            Orden del Setlist
                            <span className="text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20 font-black">
                                {selectedSongs.length} {selectedSongs.length === 1 ? "canción" : "canciones"}
                            </span>
                        </label>

                        <motion.div layout className="relative">
                            <AnimatePresence mode="popLayout" initial={false}>
                                {selectedSongs.length === 0 ? (
                                    <motion.div
                                        key="empty-setlist"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-sm text-slate-500 flex flex-col items-center gap-2 font-medium"
                                    >
                                        <Sparkles className="w-4 h-4 text-slate-600 stroke-[1.5]" />
                                        <span>Usa el buscador de arriba o el asistente de IA para armar el cancionero.</span>
                                    </motion.div>
                                ) : (
                                    <div ref={sortableContainerRef} className="flex flex-col gap-2">
                                        {selectedSongs.map((song, idx) => (
                                            <motion.div
                                                key={song.uniqueId}
                                                data-unique-id={song.uniqueId}
                                                layout
                                                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, x: -30, scale: 0.95 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl group transition-colors hover:border-slate-800"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="drag-handle p-1.5 hover:bg-slate-900 rounded-lg text-slate-600 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-colors">
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-xs font-black text-indigo-500/80 w-4 select-none text-center">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0 pl-1">
                                                        <p className="text-sm font-bold text-slate-200 truncate">{song.name}</p>
                                                        <p className="text-xs text-slate-500 truncate">{song.author || "Autor Desconocido"}</p>
                                                    </div>
                                                </div>

                                                <motion.button
                                                    type="button"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => handleRemoveSong(song.uniqueId)}
                                                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors border border-transparent hover:border-rose-500/10 mr-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* Botonera de Envío */}
                    <div className="flex items-center justify-end gap-4 md:col-span-2 mt-4 border-t border-slate-800/60 pt-6">
                        <Link href="/files" className="text-sm font-semibold text-slate-400 hover:text-slate-200 px-2 transition-colors">
                            Cancelar
                        </Link>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GenericButton color="primary">
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                    </span>
                                ) : (
                                    "Crear Cancionero"
                                )}
                            </GenericButton>
                        </motion.div>
                    </div>

                </motion.form>
            </div>

            {/* Asistente de IA Flotante */}
            <ChatBotFAB>
                {({ closeChat }: any) => (
                    <FileChatAssistant
                        closeChat={closeChat}
                        currentSongs={selectedSongs}
                        onApplySongs={({ add, remove }, suggestedTitle) => {
                            if (suggestedTitle && !name.trim()) {
                                setName(suggestedTitle);
                            }

                            setSelectedSongs((prev) => {
                                let filtered = prev;
                                if (remove && remove.length > 0) {
                                    const idsToRemove = remove.map(s => s.id);
                                    filtered = prev.filter(song => !idsToRemove.includes(song.id));
                                }

                                const formattedNewSongs = (add || []).map((song) => ({
                                    id: song.id,
                                    name: song.name,
                                    author: song.author,
                                    genre: song.genre,
                                    uniqueId: `${song.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
                                }));

                                return [...filtered, ...formattedNewSongs];
                            });

                            setErrors({});
                            const totalCambios = (add?.length || 0) + (remove?.length || 0);
                            notify.success(`¡Setlist actualizado por la IA! (${totalCambios} cambios)`);
                        }}
                    />
                )}
            </ChatBotFAB>

        </div>
    );
}
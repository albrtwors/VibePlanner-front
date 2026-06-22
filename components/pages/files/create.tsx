// app/files/create/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
    uniqueId: string; // Para evitar colisiones si añaden la misma canción varias veces
}

export default function CreateFilePage() {
    const router = useRouter();

    // Estados principales del Cancionero
    const [name, setName] = useState("");
    const [tematica, setTematica] = useState("");
    const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados del Buscador Integrado
    const [songSearch, setSongSearch] = useState("");
    const [searchResults, setSearchResults] = useState<SearchSong[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Referencia para el contenedor HTML que controlará SortableJS
    const sortableContainerRef = useRef<HTMLDivElement | null>(null);
    const sortableInstance = useRef<Sortable | null>(null);

    // 1. Buscador Reactivo de Canciones (Debounce)
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
                    setSearchResults(data.songs || []);
                }
            } catch (error) {
                console.error("Error buscando canciones:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [songSearch]);

    // 2. Inicialización de SortableJS de forma segura en Next.js
    useEffect(() => {
        if (sortableContainerRef.current && selectedSongs.length > 0) {
            // Destruimos la instancia previa si existe para evitar duplicados
            if (sortableInstance.current) {
                sortableInstance.current.destroy();
            }

            sortableInstance.current = Sortable.create(sortableContainerRef.current, {
                animation: 180,
                handle: ".drag-handle", // Elemento arrastrable específico
                ghostClass: "bg-indigo-600/10",
                onEnd: () => {
                    // Sincronizamos el estado de React basado en el nuevo orden del DOM
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

    // Agregar canción a la lista de seleccionadas
    const handleAddSong = (song: SearchSong) => {
        const newSelected: SelectedSong = {
            ...song,
            uniqueId: `${song.id}-${Date.now()}` // Id único temporal para el DOM reactivo
        };
        setSelectedSongs((prev) => [...prev, newSelected]);
        setSongSearch("");
        setSearchResults([]);
        notify.success(`"${song.name}" añadida al cancionero.`);
    };

    // Remover canción de la lista
    const handleRemoveSong = (uniqueId: string) => {
        setSelectedSongs((prev) => prev.filter((s) => s.uniqueId !== uniqueId));
    };

    // Envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            notify.error("Por favor, ingresa el nombre del cancionero.");
            return;
        }

        setIsSubmitting(true);

        // Mapeamos al formato atómico requerido por Flask asignando la posición real (index + 1)
        const structuredSongsPayload = selectedSongs.map((song, index) => ({
            id: song.id,
            position: index + 1
        }));

        try {
            const response = await fetch(`${endpoint}api/files/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name,
                    tematica: tematica,
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
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-5 border-b border-slate-800/80 pb-8">
                    <Link href="/files" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                            Crear Nuevo Cancionero
                        </h1>
                    </div>
                </div>

                {/* Formulario Principal */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 sm:p-10 rounded-2xl border border-slate-800/60 backdrop-blur-md shadow-2xl">

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Nombre del Repertorio / Evento <span className="text-indigo-400">*</span></label>
                        <input type="text" required placeholder="Ej: Concierto Acústico Central" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Temática <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                        <input type="text" placeholder="Ej: Baladas de los 80, Setlist de boda..." value={tematica} onChange={(e) => setTematica(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    {/* Buscador de canciones en vivo */}
                    <div className="flex flex-col gap-2 md:col-span-2 border-t border-slate-800/60 pt-4 relative">
                        <label className="text-xs font-bold  uppercase tracking-wider text-slate-400">Buscar y Añadir Canciones</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Escribe el nombre de la canción o artista..."
                                value={songSearch}
                                onChange={(e) => setSongSearch(e.target.value)}
                                className="w-full pl-4 pr-10 p-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-3.5 w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>

                        {/* Dropdown de Resultados flotante */}
                        {searchResults.length > 0 && (
                            <div className="left-0 w-full p-3 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto z-50 shadow-2xl divide-y divide-slate-800/50">
                                {searchResults.map((song) => (
                                    <div
                                        key={song.id}
                                        onClick={() => handleAddSong(song)}
                                        className="p-3.5 flex justify-between items-center hover:bg-indigo-600/10 cursor-pointer transition-colors group"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">{song.name}</p>
                                            <p className="text-xs text-slate-400 truncate">{song.author || "Sin autor"} • <span className="text-slate-500">{song.genre || "Sin género"}</span></p>
                                        </div>
                                        <span className="text-xs bg-slate-950 px-2.5 py-1.5 border border-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-all">
                                            + Añadir
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Contenedor del orden con Sortable.js */}
                    <div className="flex flex-col gap-3 md:col-span-2 mt-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Orden del Setlist ({selectedSongs.length} {selectedSongs.length === 1 ? "canción" : "canciones"})
                        </label>

                        {selectedSongs.length === 0 ? (
                            <div className="text-center py-8 bg-slate-950/40 border border-dashed border-slate-800 rounded-xl text-sm text-slate-500">
                                Usa el buscador de arriba para armar el orden de tu cancionero.
                            </div>
                        ) : (
                            <div ref={sortableContainerRef} className="flex flex-col gap-2">
                                {selectedSongs.map((song, idx) => (
                                    <div
                                        key={song.uniqueId}
                                        data-unique-id={song.uniqueId}
                                        className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl group transition-all"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Control deslizante de arrastre */}
                                            <div className="drag-handle p-1.5 hover:bg-slate-900 rounded-lg text-slate-600 hover:text-indigo-400 cursor-grab active:cursor-grabbing transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                                </svg>
                                            </div>
                                            <span className="text-xs font-black text-indigo-500/80 w-4 select-none">
                                                {idx + 1}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-200 truncate">{song.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{song.author || "Autor Desconocido"}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleRemoveSong(song.uniqueId)}
                                            className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Botonera de Envío */}
                    <div className="flex items-center justify-end gap-4 md:col-span-2 mt-4 border-t border-slate-800/60 pt-6">
                        <Link href="/files" className="text-sm text-slate-400 hover:text-slate-200 px-2 transition-colors">
                            Cancelar
                        </Link>
                        <GenericButton color="primary">
                            {isSubmitting ? "Guardando..." : "Crear Cancionero"}
                        </GenericButton>
                    </div>

                </form>
            </div>

            {/* Inyección e Integración del Asistente de IA Flotante */}
            <ChatBotFAB>
                {({ closeChat }: any) => (
                    <FileChatAssistant
                        closeChat={closeChat}
                        onApplySongs={(songs, suggestedTitle) => {
                            // Si la IA sugiere un título estratégico y el campo del nombre está vacío, lo inyectamos
                            if (suggestedTitle && !name) {
                                setName(suggestedTitle);
                            }

                            // Formateamos las canciones mapeando los datos de la DB al estado con uniqueId seguro
                            const formattedSongs = songs.map((song) => ({
                                id: song.id,
                                name: song.name,
                                author: song.author,
                                genre: song.genre,
                                uniqueId: `${song.id}-${Date.now()}-${Math.random()}`
                            }));

                            // Concatenamos las canciones al setlist conservando lo que ya tenía el usuario
                            setSelectedSongs((prev) => [...prev, ...formattedSongs]);
                            notify.success(`¡Se inyectaron ${songs.length} canciones al setlist!`);
                        }}
                    />
                )}
            </ChatBotFAB>

        </div>
    );
}
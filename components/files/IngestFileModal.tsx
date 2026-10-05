// components/files/IngestFileModal.tsx
"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    FileUp,
    Loader2,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";
import { notify } from "@/utils/toast";
import { apiUrl } from "@/consts/backEndpoint";
import { extractTextFromFile, isSupportedFile, MAX_FILE_MB } from "@/utils/fileTextExtractor";
import { SONG_KEYS } from "@/utils/chords";

/** Bloque de canción detectado, editable antes de guardarlo. */
export interface IngestSong {
    name: string;
    author: string;
    genre: string;
    key: string;
    raw_text: string;
    structure: { parts: Array<{ title: string; content: string }> };
}

/** Lo que devuelve POST /api/files/ingest/parse. */
interface IngestApiSong {
    name: string | null;
    author: string | null;
    genre: string | null;
    key: string | null;
    raw_text: string;
    structure: { parts: Array<{ title: string; content: string }> };
}

interface IngestApiResponse {
    message?: string;
    error?: string;
    songs?: IngestApiSong[];
}

interface Props {
    open: boolean;
    onClose: () => void;
    fileName: string;
    tematica?: string;
    /** Se llama con el id del cancionero recién creado. */
    onCreated: (fileId: number) => void;
}

export default function IngestFileModal({
    open,
    onClose,
    fileName,
    tematica,
    onCreated,
}: Props) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [source, setSource] = useState<string | null>(null);
    const [songs, setSongs] = useState<IngestSong[]>([]);

    const cerrar = () => {
        if (parsing || saving) return;
        setSongs([]);
        setSource(null);
        onClose();
    };

    /** Manda el texto al backend, que es quien corta las canciones. */
    const parsear = async (text: string, origen: string) => {
        setParsing(true);
        try {
            const res = await fetch(apiUrl("/api/files/ingest/parse"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = (await res.json()) as IngestApiResponse;
            if (!res.ok) throw new Error(data.error || "No pude analizar el archivo.");

            const detectados: IngestSong[] = (data.songs || []).map((s) => ({
                name: s.name || "",
                author: s.author || "",
                genre: s.genre || "",
                key: s.key || "",
                raw_text: s.raw_text || "",
                structure: s.structure || { parts: [] },
            }));

            setSongs(detectados);
            setSource(origen);

            if (detectados.length === 0) {
                notify.error("No encontré ninguna canción en ese archivo.");
            } else {
                notify.success(
                    `Detecté ${detectados.length} canción${detectados.length === 1 ? "" : "es"}. Revisá y confirmá.`
                );
            }
        } catch (err) {
            notify.error(
                err instanceof Error ? err.message : "No pude analizar el archivo."
            );
        } finally {
            setParsing(false);
        }
    };

    const handleFile = async (file: File) => {
        if (!isSupportedFile(file.name)) {
            notify.error("Solo puedo leer archivos .txt, .pdf o .docx.");
            return;
        }
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            notify.error(`El archivo supera los ${MAX_FILE_MB} MB.`);
            return;
        }

        try {
            const { text, engine } = await extractTextFromFile(file);
            await parsear(text, `${file.name} (${engine.toUpperCase()})`);
        } catch (err) {
            notify.error(
                err instanceof Error ? err.message : "No pude leer el archivo."
            );
        }
    };

    const update = (index: number, patch: Partial<IngestSong>) => {
        setSongs((prev) =>
            prev.map((song, i) => (i === index ? { ...song, ...patch } : song))
        );
    };

    const remove = (index: number) => {
        setSongs((prev) => prev.filter((_, i) => i !== index));
    };

    const guardar = async () => {
        const limpias = songs.filter((s) => s.name.trim() !== "");
        if (limpias.length === 0) {
            notify.error("Dejá al menos una canción con título.");
            return;
        }
        if (!fileName.trim()) {
            notify.error("Ponéle un nombre al cancionero antes de importar.");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(apiUrl("/api/files/ingest/commit"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    songs: limpias.map((s) => ({
                        name: s.name.trim(),
                        author: s.author.trim() || null,
                        genre: s.genre.trim() || null,
                        key: s.key.trim() || null,
                        structure: s.structure,
                        raw_text: s.raw_text,
                    })),
                    file: {
                        name: fileName.trim(),
                        tematica: (tematica || "").trim() || null,
                    },
                }),
            });
            const data = (await res.json()) as {
                message?: string;
                error?: string;
                file_id?: number;
            };
            if (!res.ok) throw new Error(data.error || "No pude guardar la importación.");

            notify.success(data.message || "Importación lista.");
            setSongs([]);
            setSource(null);
            if (typeof data.file_id === "number") {
                onCreated(data.file_id);
            }
        } catch (err) {
            notify.error(
                err instanceof Error ? err.message : "No pude guardar la importación."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) cerrar();
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        className="w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-800">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                                    Ingesta masiva
                                </span>
                                <h2 className="text-lg font-black uppercase tracking-tight text-slate-100 mt-0.5">
                                    Importar canciones de un archivo
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Subí un .txt, .pdf o .docx. Detecto título, artista, tono y
                                    letra por separado, y vos decidís qué entra.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={cerrar}
                                disabled={parsing || saving}
                                className="p-2 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-40 shrink-0"
                                aria-label="Cerrar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Zona de drop */}
                        {songs.length === 0 && (
                            <div className="p-5">
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setDragging(false);
                                        const file = e.dataTransfer.files?.[0];
                                        if (file) handleFile(file);
                                    }}
                                    onClick={() => inputRef.current?.click()}
                                    className={`cursor-pointer border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                                        dragging
                                            ? "border-indigo-500 bg-indigo-950/30"
                                            : "border-slate-700 hover:border-slate-600 bg-slate-950/40"
                                    }`}
                                >
                                    {parsing ? (
                                        <>
                                            <Loader2 className="w-8 h-8 mx-auto text-indigo-400 animate-spin mb-3" />
                                            <p className="text-sm font-bold text-slate-300">
                                                Leyendo el archivo…
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="w-8 h-8 mx-auto text-slate-500 mb-3" />
                                            <p className="text-sm font-bold text-slate-200">
                                                Arrastrá el archivo acá
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                .txt · .pdf · .docx (máx {MAX_FILE_MB} MB)
                                            </p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="file"
                                    accept=".txt,.pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFile(file);
                                        e.target.value = "";
                                    }}
                                />

                                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                                    <AlertCircle className="w-3 h-3 inline mr-1" />
                                    Separá las canciones con una línea como{" "}
                                    <code className="text-indigo-300">---</code> o{" "}
                                    <code className="text-indigo-300">## Título</code>. Los
                                    acordes <code className="text-indigo-300">[Am]</code> se
                                    conservan tal cual.
                                </p>
                            </div>
                        )}

                        {/* Revisión de lo detectado */}
                        {songs.length > 0 && (
                            <div className="p-5 space-y-3 max-h-[55vh] overflow-y-auto">
                                <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                    <span>
                                        Detectadas · {songs.length}
                                        {source && (
                                            <span className="text-slate-600 normal-case tracking-normal ml-2">
                                                {source}
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSongs([]);
                                            setSource(null);
                                        }}
                                        className="text-slate-500 hover:text-indigo-400 transition-colors normal-case tracking-normal font-bold"
                                    >
                                        Cambiar archivo
                                    </button>
                                </div>

                                {songs.map((song, index) => (
                                    <div
                                        key={index}
                                        className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-600 w-5 shrink-0">
                                                {index + 1}
                                            </span>
                                            <input
                                                type="text"
                                                value={song.name}
                                                onChange={(e) =>
                                                    update(index, { name: e.target.value })
                                                }
                                                placeholder="Título"
                                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => remove(index)}
                                                className="p-2 text-slate-600 hover:text-rose-400 transition-colors shrink-0"
                                                aria-label="Quitar canción"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pl-7">
                                            <input
                                                type="text"
                                                value={song.author}
                                                onChange={(e) =>
                                                    update(index, { author: e.target.value })
                                                }
                                                placeholder="Artista"
                                                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                            />
                                            <input
                                                type="text"
                                                value={song.genre}
                                                onChange={(e) =>
                                                    update(index, { genre: e.target.value })
                                                }
                                                placeholder="Género"
                                                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                            />
                                            <select
                                                value={song.key}
                                                onChange={(e) =>
                                                    update(index, { key: e.target.value })
                                                }
                                                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                                            >
                                                <option value="">Sin tono</option>
                                                {SONG_KEYS.map((k) => (
                                                    <option key={k} value={k}>
                                                        {k}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <details className="pl-7">
                                            <summary className="text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                                                Ver / editar letra
                                            </summary>
                                            <textarea
                                                value={song.raw_text}
                                                onChange={(e) =>
                                                    update(index, {
                                                        raw_text: e.target.value,
                                                        structure: {
                                                            parts: [
                                                                {
                                                                    title: "letra",
                                                                    content: e.target.value,
                                                                },
                                                            ],
                                                        },
                                                    })
                                                }
                                                rows={6}
                                                className="mt-2 w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                                            />
                                        </details>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 p-5 border-t border-slate-800 bg-slate-950/40">
                            <button
                                type="button"
                                onClick={cerrar}
                                disabled={parsing || saving}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 rounded-lg transition-colors disabled:opacity-40"
                            >
                                Cancelar
                            </button>

                            {songs.length > 0 && (
                                <button
                                    type="button"
                                    onClick={guardar}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {saving
                                        ? "Guardando…"
                                        : `Importar ${songs.length} a "${fileName || "sin nombre"}"`}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
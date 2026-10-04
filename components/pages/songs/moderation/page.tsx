"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, ArrowRight, Lightbulb, Music4 } from "lucide-react";
import { apiUrl } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";
import { songStatusMeta } from "@/utils/songStatus";

interface QueueSong {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
    key: string | null;
    status: string;
    suggestions_count: number;
}

interface PendingSuggestion {
    id: number;
    song_id: number;
    song_name: string | null;
    user: string | null;
    status: string;
    notes: string | null;
    suggested_key: string | null;
    created_at: string | null;
}

export default function ModerationQueuePage() {
    const [songs, setSongs] = useState<QueueSong[]>([]);
    const [suggestions, setSuggestions] = useState<PendingSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [workingId, setWorkingId] = useState<number | null>(null);

    const fetchQueue = async () => {
        try {
            const res = await fetch(apiUrl("/api/songs/moderation/queue"));
            if (!res.ok) throw new Error("No se pudo cargar la cola de moderación.");
            const data = await res.json();
            setSongs(data.songs || []);
            setSuggestions(data.pending_suggestions || []);
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQueue(); }, []);

    const resolveSuggestion = async (suggestion: PendingSuggestion, action: "aprobar" | "rechazar") => {
        setWorkingId(suggestion.id);
        try {
            const res = await fetch(apiUrl(`/api/songs/suggestions/${suggestion.id}/resolve`), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "No se pudo resolver la sugerencia.");
            notify.success(data.message || "Sugerencia resuelta.");
            await fetchQueue();
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setWorkingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> Cargando cola de moderación...
            </div>
        );
    }

    return (
        <div className="relative max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8 text-white overflow-hidden">
            <div className="absolute top-0 right-1/4 -z-10 h-64 w-64 rounded-full bg-amber-500/5 blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-2 border-b border-slate-800/60 pb-6"
            >
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Moderación
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Cola de revisión
                </h1>
                <p className="text-base text-slate-400 max-w-2xl">
                    Canciones esperando aprobación o publicación, y sugerencias del equipo pendientes de resolver.
                </p>
            </motion.div>

            <section className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <Music4 className="w-4 h-4 text-indigo-400" /> Canciones en cola ({songs.length})
                </h2>

                {songs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl text-sm text-slate-500">
                        No hay canciones esperando moderación. Todo al día.
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {songs.map((song) => {
                            const meta = songStatusMeta(song.status);
                            return (
                                <motion.div
                                    key={song.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-800/80 bg-slate-900"
                                >
                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-semibold text-slate-100">{song.name}</h3>
                                        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
                                            <span className="text-slate-300">{song.author || "Autor desconocido"}</span>
                                            <span className={`px-2 py-0.5 border rounded-full text-[10px] font-bold uppercase ${meta.className}`}>
                                                {meta.label}
                                            </span>
                                            {song.key && <span className="font-mono text-indigo-300">{song.key}</span>}
                                            {song.suggestions_count > 0 && (
                                                <span className="text-amber-300">{song.suggestions_count} sugerencia(s)</span>
                                            )}
                                        </div>
                                    </div>
                                    <Link
                                        href={`/songs/${song.id}`}
                                        className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
                                    >
                                        Revisar <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="flex flex-col gap-4">
                <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
                    <Lightbulb className="w-4 h-4 text-amber-400" /> Sugerencias pendientes ({suggestions.length})
                </h2>

                <AnimatePresence mode="popLayout">
                    {suggestions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl text-sm text-slate-500">
                            No hay sugerencias pendientes.
                        </div>
                    ) : (
                        suggestions.map((s) => (
                            <motion.div
                                key={s.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: -30 }}
                                className="flex flex-col gap-3 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40"
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="font-semibold text-slate-200">{s.song_name}</span>
                                        <span>· propone {s.user || "alguien"}</span>
                                        {s.suggested_key && <span className="font-mono text-indigo-300">{s.suggested_key}</span>}
                                    </div>
                                    {s.notes && <p className="text-sm text-slate-300">{s.notes}</p>}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => resolveSuggestion(s, "aprobar")}
                                        disabled={workingId === s.id}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                    >
                                        {workingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Aprobar
                                    </button>
                                    <button
                                        onClick={() => resolveSuggestion(s, "rechazar")}
                                        disabled={workingId === s.id}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> Rechazar
                                    </button>
                                    <Link
                                        href={`/songs/${s.song_id}`}
                                        className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
                                    >
                                        Ver canción <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </section>
        </div>
    );
}

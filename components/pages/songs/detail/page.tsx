"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft, Music4, HelpCircle, Guitar, Save, Send, ShieldCheck,
    CheckCircle2, XCircle, Rocket, Loader2, MessageSquarePlus, Lightbulb,
} from "lucide-react";
import { apiUrl } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";
import { getClientProfile } from "@/utils/proxy";
import { hasPermission, ClientProfile } from "@/utils/permissions";
import { songStatusMeta } from "@/utils/songStatus";
import { SONG_KEYS } from "@/utils/chords";
import { parseRawTextToStructure } from "@/utils/songParser";
import ChordLyricPreviewer from "@/components/songs/ChordLyricPreviewer";

interface SongPart {
    title: string;
    content: string;
}

interface Suggestion {
    id: number;
    status: string;
    notes: string | null;
    suggested_key: string | null;
    user: string | null;
    created_at: string | null;
    resolution_notes: string | null;
}

interface SongDetail {
    id: number;
    name: string;
    author: string | null;
    genre: string | null;
    structure: { parts: SongPart[] };
    key: string | null;
    status: string;
    is_public: boolean;
    submitted_at: string | null;
    review_notes: string | null;
    reviewed_at: string | null;
    reviewed_by: string | null;
    suggestions_count: number;
    can_edit: boolean;
    can_review: boolean;
    suggestions: Suggestion[];
}

interface TransposeResult {
    structure: { parts: SongPart[] };
    source_key: string | null;
    target_key: string;
    semitones: number;
    capo: number | null;
    chords_changed: number;
    unchanged: boolean;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function SongDetailPage({ params }: PageProps) {
    const { id } = use(params);

    const [song, setSong] = useState<SongDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<ClientProfile | null>(null);

    const [targetKey, setTargetKey] = useState("");
    const [preview, setPreview] = useState<TransposeResult | null>(null);
    const [working, setWorking] = useState(false);

    const [reviewNotes, setReviewNotes] = useState("");

    const [suggestKey, setSuggestKey] = useState("");
    const [suggestNotes, setSuggestNotes] = useState("");
    const [suggestStructure, setSuggestStructure] = useState("");
    const [sendingSuggestion, setSendingSuggestion] = useState(false);

    const canSuggest = hasPermission(profile?.permissions, "songs.suggest");
    const canCreate = hasPermission(profile?.permissions, "songs.create");

    const fetchSong = async () => {
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}`));
            if (!res.ok) {
                if (res.status === 404) throw new Error("La canción no existe");
                throw new Error("Error en el servidor");
            }
            const data: SongDetail = await res.json();
            setSong(data);
            setTargetKey(data.key || "");
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "No se pudo cargar el detalle de la canción.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSong();
        getClientProfile().then(setProfile);
    }, [id]);

    const handleTransposePreview = async () => {
        if (!targetKey) {
            notify.error("Elegí un tono de destino.");
            return;
        }
        setWorking(true);
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}/transpose`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_key: targetKey }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "No se pudo transponer.");
            setPreview(data);
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setWorking(false);
        }
    };

    const handleTransposeApply = async () => {
        if (!targetKey) return;
        setWorking(true);
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}/transpose`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target_key: targetKey, apply: true }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || "No se pudo guardar.");
            setPreview(null);
            await fetchSong();
            notify.success(data.message || "Transposición guardada.");
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setWorking(false);
        }
    };

    const handleSubmitToReview = async () => {
        setWorking(true);
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}/submit`), { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "No se pudo enviar a revisión.");
            setSong(data.song);
            notify.success(data.message || "Canción enviada a revisión.");
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setWorking(false);
        }
    };

    const handleReview = async (action: "aprobar" | "rechazar" | "publicar") => {
        if (action === "rechazar" && !reviewNotes.trim()) {
            notify.error("Para rechazar tenés que dejar un motivo.");
            return;
        }
        setWorking(true);
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}/review`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, notes: reviewNotes }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "No se pudo resolver.");
            setSong(data.song);
            setReviewNotes("");
            notify.success(data.message || "Revisión registrada.");
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setWorking(false);
        }
    };

    const handleCreateSuggestion = async () => {
        const payload: Record<string, unknown> = {};
        if (suggestKey) payload.key = suggestKey;
        if (suggestStructure.trim()) payload.structure = parseRawTextToStructure(suggestStructure);
        if (suggestNotes.trim()) payload.notes = suggestNotes;

        if (!payload.key && !payload.structure) {
            notify.error("Proponé al menos un tono o una estructura.");
            return;
        }

        setSendingSuggestion(true);
        try {
            const res = await fetch(apiUrl(`/api/songs/${id}/suggestions`), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "No se pudo enviar la sugerencia.");
            setSuggestKey("");
            setSuggestNotes("");
            setSuggestStructure("");
            await fetchSong();
            notify.success(data.message || "Sugerencia enviada.");
        } catch (error: any) {
            notify.error(error.message);
        } finally {
            setSendingSuggestion(false);
        }
    };

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

    const statusMeta = songStatusMeta(song.status);
    const displayedStructure = preview?.structure ?? song.structure;
    const canRetry = song.status === "borrador" || song.status === "rechazada";

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Efectos Blur de Fondo Fluido */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">

                {/* Header Animado */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-8"
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
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-black uppercase tracking-wider ${statusMeta.className}`}>
                                    {statusMeta.label}
                                </span>
                                {song.key && (
                                    <span className="px-2.5 py-0.5 border border-indigo-500/20 bg-indigo-500/10 rounded-full font-mono text-xs font-bold text-indigo-300">
                                        {song.key}
                                    </span>
                                )}
                                {song.author && <span className="text-xs text-slate-400">{song.author}</span>}
                            </div>
                        </div>
                    </div>

                    {song.can_edit && (
                        <Link
                            href={`/songs/${id}/edit`}
                            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 transition-colors"
                        >
                            Editar
                        </Link>
                    )}
                </motion.div>

                {/* Panel de acciones: transponer / enviar a revisión */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 sm:p-5 backdrop-blur-md"
                >
                    <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex flex-col gap-1.5 flex-1 sm:max-w-xs">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                                <Guitar className="w-3.5 h-3.5" /> Transportar a
                            </label>
                            <select
                                value={targetKey}
                                onChange={(e) => { setTargetKey(e.target.value); setPreview(null); }}
                                className="px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="">— Tono —</option>
                                {SONG_KEYS.map((k) => (
                                    <option key={k} value={k}>{k}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={handleTransposePreview}
                            disabled={working}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                            {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Guitar className="w-4 h-4" />}
                            Previsualizar
                        </button>

                        {song.can_edit && (
                            <button
                                onClick={handleTransposeApply}
                                disabled={working || !targetKey}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                            >
                                <Save className="w-4 h-4" /> Guardar tono
                            </button>
                        )}

                        {canRetry && song.can_edit && canCreate && (
                            <button
                                onClick={handleSubmitToReview}
                                disabled={working}
                                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors sm:ml-auto"
                            >
                                <Send className="w-4 h-4" /> Enviar a revisión
                            </button>
                        )}
                    </div>

                    {preview && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                            <span>
                                {preview.unchanged
                                    ? "La canción ya está en ese tono."
                                    : `De ${preview.source_key || "?"} a ${preview.target_key} (${preview.semitones > 0 ? "+" : ""}${preview.semitones} semitonos)`}
                            </span>
                            <span>{preview.chords_changed} acordes movidos</span>
                            {preview.capo != null && (
                                <span className="text-amber-400">Sugerencia: capo en traste {preview.capo}</span>
                            )}
                        </div>
                    )}

                    {song.review_notes && (
                        <p className="text-xs text-rose-300 border-t border-slate-800/60 pt-3">
                            Motivo del moderador: {song.review_notes}
                        </p>
                    )}
                </motion.div>

                {/* Panel de moderación */}
                {song.can_review && (song.status === "en_revision" || song.status === "aprobada") && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5"
                    >
                        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-amber-300">
                            <ShieldCheck className="w-4 h-4" /> Resolución de moderación
                        </h2>
                        <textarea
                            rows={2}
                            placeholder="Notas o motivo (obligatorio al rechazar)..."
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500 resize-y"
                        />
                        <div className="flex flex-wrap gap-2">
                            {song.status === "en_revision" && (
                                <>
                                    <button
                                        onClick={() => handleReview("aprobar")}
                                        disabled={working}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                                    </button>
                                    <button
                                        onClick={() => handleReview("rechazar")}
                                        disabled={working}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" /> Rechazar
                                    </button>
                                </>
                            )}
                            {song.status === "aprobada" && (
                                <button
                                    onClick={() => handleReview("publicar")}
                                    disabled={working}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
                                >
                                    <Rocket className="w-4 h-4" /> Publicar
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Contenedor del Visor Animado con delay sutil */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 90, damping: 16, delay: 0.1 }}
                    className="bg-slate-900/10 rounded-2xl border border-slate-800/50 backdrop-blur-md p-2 shadow-xl shadow-black/20"
                >
                    {displayedStructure && displayedStructure.parts && displayedStructure.parts.length > 0 ? (
                        <ChordLyricPreviewer
                            structure={displayedStructure}
                            songName={preview ? `${song.name} (${preview.target_key})` : song.name}
                            author={song.author || undefined}
                        />
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

                {/* Sugerencias del equipo */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/20 p-5"
                >
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-300">
                        <Lightbulb className="w-4 h-4 text-amber-400" /> Sugerencias
                        {song.suggestions_count > 0 && (
                            <span className="ml-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-black text-amber-300">
                                {song.suggestions_count} pendientes
                            </span>
                        )}
                    </h2>

                    {song.suggestions && song.suggestions.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {song.suggestions.map((s) => (
                                <li key={s.id} className="rounded-xl border border-slate-800/60 bg-slate-950/40 p-3 text-sm">
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <span className="font-semibold text-slate-300">{s.user || "Alguien"}</span>
                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${s.status === "pendiente" ? "border-amber-500/30 bg-amber-500/10 text-amber-300" : s.status === "aprobada" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"}`}>
                                            {s.status}
                                        </span>
                                        {s.suggested_key && <span className="font-mono text-indigo-300">{s.suggested_key}</span>}
                                    </div>
                                    {s.notes && <p className="mt-1 text-slate-300">{s.notes}</p>}
                                    {s.resolution_notes && (
                                        <p className="mt-1 text-xs text-slate-500">Resolución: {s.resolution_notes}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-xs text-slate-500">Todavía no hay sugerencias para esta canción.</p>
                    )}

                    {canSuggest && (
                        <div className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
                            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                                <MessageSquarePlus className="w-3.5 h-3.5" /> Proponer un arreglo
                            </span>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={suggestKey}
                                    onChange={(e) => setSuggestKey(e.target.value)}
                                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 sm:max-w-[10rem]"
                                >
                                    <option value="">Mismo tono</option>
                                    {SONG_KEYS.map((k) => (
                                        <option key={k} value={k}>{k}</option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    placeholder="Notas (opcional)..."
                                    value={suggestNotes}
                                    onChange={(e) => setSuggestNotes(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <textarea
                                rows={3}
                                placeholder="Estructura propuesta (opcional). Podés usar [CORO] para secciones y [Am] para acordes..."
                                value={suggestStructure}
                                onChange={(e) => setSuggestStructure(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleCreateSuggestion}
                                    disabled={sendingSuggestion}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                                >
                                    {sendingSuggestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
                                    Enviar sugerencia
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>

            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Music2, Loader2, FileMusic } from "lucide-react";
import GenericButton from "@/components/buttons/GenericButton";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import VibeHelperChat from "@/components/chatbot/SongHelperChat";
import SongStructureInput from "@/components/forms/SongStructureInput";
import SongStructureViewer from "@/components/songs/SongStructureViewer";
import { parseRawTextToStructure } from "@/utils/songParser";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface SongStructure {
    name: string;
    author: string;
    genre: string;
    structure: { parts: Array<{ title: string; content: string }> };
}

interface FormErrors {
    title?: string;
    author?: string;
    genre?: string;
    structureText?: string;
}

// Configuración de animaciones compartidas
const formFadeVariant = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

export default function CreateSongPage() {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [structureText, setStructureText] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAutofillFromAI = (songData: SongStructure) => {
        setTitle(songData.name);
        setAuthor(songData.author);
        setGenre(songData.genre || "");

        const formattedText = songData.structure.parts
            .map((part) => `[${part.title.toUpperCase()}]\n${part.content}`)
            .join("\n\n");

        setStructureText(formattedText);
        setErrors({});
        notify.success("¡Datos e itinerario mapeados con éxito!");
    };

    const validateForm = (): boolean => {
        const localErrors: FormErrors = {};
        const hasNumbers = /\d/;

        if (!title.trim()) {
            localErrors.title = "El título es obligatorio, varón.";
        } else if (title.trim().length < 3) {
            localErrors.title = "El título debe tener al menos 3 caracteres.";
        } else if (hasNumbers.test(title)) {
            localErrors.title = "El título no puede contener números.";
        }

        if (!author.trim()) {
            localErrors.author = "El autor o artista es obligatorio.";
        } else if (author.trim().length < 3) {
            localErrors.author = "El nombre del autor debe tener al menos 3 caracteres.";
        } else if (hasNumbers.test(author)) {
            localErrors.author = "El nombre del autor no puede contener números.";
        }

        if (genre.trim()) {
            if (genre.trim().length < 3) {
                localErrors.genre = "El género debe tener al menos 3 caracteres.";
            } else if (hasNumbers.test(genre)) {
                localErrors.genre = "El género no puede contener números.";
            }
        }

        if (!structureText.trim()) {
            localErrors.structureText = "La estructura o letra de la canción es obligatoria.";
        }

        setErrors(localErrors);
        return Object.keys(localErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            notify.error("Revisa los campos del formulario antes de guardar, mano.");
            return;
        }

        setIsSubmitting(true);
        const finalJsonStructure = parseRawTextToStructure(structureText);

        try {
            const response = await fetch(`${endpoint}api/songs/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: title,
                    author: author,
                    genre: genre,
                    structure: finalJsonStructure
                })
            });

            if (response.ok) {
                notify.success(`¡Canción "${title}" registrada correctamente!`);
                setTitle(""); setAuthor(""); setGenre(""); setStructureText("");
                setErrors({});
            } else {
                const errData = await response.json().catch(() => ({}));
                notify.error(errData.error || "Error del servidor al guardar la canción.");
            }
        } catch (error) {
            notify.error("No se pudo conectar con el servidor de Flask.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Luces de ambiente fluidas */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">

                {/* Header Animado */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-5 border-b border-slate-800/60 pb-8"
                >
                    <motion.div whileHover={{ scale: 1.05, x: -2 }} whileTap={{ scale: 0.95 }}>
                        <Link href="/songs" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-colors block">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    </motion.div>
                    <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Repertorio General</span>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 mt-0.5">
                            Crear Nueva Canción
                        </h1>
                    </div>
                </motion.div>

                {/* Formulario con entrada elástica y Blur */}
                <motion.form
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 15 }}
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-6 sm:p-10 rounded-2xl border border-slate-800/80 backdrop-blur-md shadow-2xl"
                >
                    {/* Título */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Título <span className="text-indigo-400">*</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Bohemian Rhapsody"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-slate-200 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.title
                                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                                : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.title && (
                                <motion.p variants={formFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5">
                                    ⚠️ {errors.title}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Autor */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Autor / Artista <span className="text-indigo-400">*</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Queen"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-slate-200 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.author
                                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                                : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.author && (
                                <motion.p variants={formFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5">
                                    ⚠️ {errors.author}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Género */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Género <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                        <input
                            type="text"
                            placeholder="Ej: Rock Sinfónico"
                            value={genre}
                            onChange={(e) => setGenre(e.target.value)}
                            className={`w-full px-4 py-3 bg-slate-950/60 border rounded-xl text-slate-200 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.genre
                                ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/10"
                                : "border-slate-800 focus:border-indigo-500 focus:ring-indigo-500/10"
                                }`}
                        />
                        <AnimatePresence>
                            {errors.genre && (
                                <motion.p variants={formFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5">
                                    ⚠️ {errors.genre}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Contenedor de Estructura */}
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <SongStructureInput value={structureText} onChange={setStructureText} />
                        <AnimatePresence>
                            {errors.structureText && (
                                <motion.p variants={formFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-xs font-semibold text-rose-400 tracking-wide mt-0.5">
                                    ⚠️ {errors.structureText}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Botón de Envío Animado */}
                    <div className="flex items-center justify-end gap-4 md:col-span-2 mt-4 border-t border-slate-800/60 pt-6">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GenericButton color="primary">
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <Music2 className="w-4 h-4" /> Guardar Canción
                                    </span>
                                )}
                            </GenericButton>
                        </motion.div>
                    </div>
                </motion.form>

                {/* Previsualización en Tiempo Real Fluida */}
                <AnimatePresence mode="wait">
                    {structureText.trim() && (
                        <motion.div
                            key="live-preview"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-3"
                        >
                            <div className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-widest text-indigo-400/80">
                                <FileMusic className="w-4 h-4" /> Vista Previa del Itinerario
                            </div>
                            <SongStructureViewer structure={parseRawTextToStructure(structureText)} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Asistente Flotante Integrado */}
            <ChatBotFAB>
                {({ closeChat }: any) => (
                    <VibeHelperChat closeChat={closeChat} onApplyStructure={handleAutofillFromAI} />
                )}
            </ChatBotFAB>
        </div>
    );
}
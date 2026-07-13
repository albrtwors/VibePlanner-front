"use client";

import { useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Camera,
    MousePointer,
    Trash2,
    Plus,
    Save,
    AlertCircle,
    Zap,
    Loader2
} from "lucide-react";
import { endpoint } from "@/consts/backEndpoint";
import { notify } from "@/utils/toast";
import GenericButton from "@/components/buttons/GenericButton";
import ChordLyricPreviewer from "@/components/songs/ChordLyricPreviewer";
import SongChatAssistant from "@/components/chatbot/SongChatAssistant";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";

interface SongPart {
    title: string;
    content: string;
}

interface FormErrors {
    name?: string;
    author?: string;
    genre?: string;
}

const VALID_CHORDS = new Set([
    "C", "D", "E", "F", "G", "A", "B",
    "Cm", "Dm", "Em", "Fm", "Gm", "Am", "Bm",
    "C#", "F#", "G#", "Bb", "Eb",
    "C#m", "F#m", "G#m"
]);

const errorFadeVariant = {
    hidden: { opacity: 0, y: -4 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18 } }
};

export default function CreateSongPage() {
    const router = useNextRouter();
    const [loading, setLoading] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);

    // Estados del Formulario
    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [parts, setParts] = useState<SongPart[]>([
        { title: "Estrofa 1", content: "En tu [C]nombre hoy venimos\nEstamos tan [Am]agradecidos" }
    ]);

    const [errors, setErrors] = useState<FormErrors>({});

    // Estados del Inyector por clicks
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Array<{ partIdx: number; charPos: number }>>([]);
    const [chordSequenceInput, setChordSequenceInput] = useState("");

    const validateForm = (): boolean => {
        const localErrors: FormErrors = {};
        const hasNumbers = /\d/;

        if (!name.trim()) {
            localErrors.name = "El título es obligatorio, mano.";
        } else if (name.trim().length < 3) {
            localErrors.name = "El título debe tener al menos 3 caracteres.";
        } else if (hasNumbers.test(name)) {
            localErrors.name = "El título no puede contener números.";
        }

        if (!author.trim()) {
            localErrors.author = "El autor es obligatorio.";
        } else if (author.trim().length < 3) {
            localErrors.author = "El autor debe tener al menos 3 caracteres.";
        } else if (hasNumbers.test(author)) {
            localErrors.author = "El autor no puede contener números.";
        }

        if (genre.trim()) {
            if (genre.trim().length < 3) {
                localErrors.genre = "El género debe tener al menos 3 caracteres.";
            } else if (hasNumbers.test(genre)) {
                localErrors.genre = "El género no puede contener números.";
            }
        }

        setErrors(localErrors);
        return Object.keys(localErrors).length === 0;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingImage(true);
        notify.success("Procesando imagen con el Motor de Visión...");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                const base64Raw = (reader.result as string).split(",")[1];

                const res = await fetch(`${endpoint}api/songs/upload-vision`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_base64: base64Raw }),
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Error en el escaneo del cifrado.");
                }

                const data = await res.json();

                if (data.structure) {
                    setName(data.detected_name || "");
                    if (data.structure.parts) {
                        setParts(data.structure.parts);
                    }
                    setErrors({});
                    notify.success(data.message || "¡Imagen armonizada con el formulario!");
                } else {
                    notify.error("La IA no pudo procesar esta imagen.");
                }
            } catch (err: any) {
                notify.error(err.message || "Fallo de conexión con el motor OCR.");
            } finally {
                setProcessingImage(false);
            }
        };
    };

    const handleTextareaClick = (partIdx: number, e: React.MouseEvent<HTMLTextAreaElement>) => {
        if (!isSelectionMode) return;
        const textarea = e.currentTarget;
        const charPos = textarea.selectionStart;

        if (selectedIndices.some(item => item.partIdx === partIdx && item.charPos === charPos)) return;
        setSelectedIndices([...selectedIndices, { partIdx, charPos }]);
        notify.success(`Marca registrada en posición ${charPos}`);
    };

    const applyChordSequence = () => {
        if (selectedIndices.length === 0) {
            notify.error("Primero haz click en la letra, varón.");
            return;
        }

        const chords = chordSequenceInput.trim().split(/[\s,]+/);
        const invalidChords = chords.filter(c => c && !VALID_CHORDS.has(c));
        if (invalidChords.length > 0) {
            notify.error(`Tonos no válidos: ${invalidChords.join(", ")}`);
            return;
        }

        const sortedIndices = [...selectedIndices].sort((a, b) => {
            if (a.partIdx !== b.partIdx) return b.partIdx - a.partIdx;
            return b.charPos - a.charPos;
        });

        const updatedParts = [...parts];

        sortedIndices.forEach((marker, index) => {
            const chord = chords[index] || chords[chords.length - 1];
            if (!chord) return;

            const currentContent = updatedParts[marker.partIdx].content;
            const newContent =
                currentContent.substring(0, marker.charPos) +
                `[${chord}]` +
                currentContent.substring(marker.charPos);

            updatedParts[marker.partIdx].content = newContent;
        });

        setParts(updatedParts);
        setSelectedIndices([]);
        setChordSequenceInput("");
        setIsSelectionMode(false);
        notify.success("¡Ráfaga armada en caliente!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            notify.error("Por favor corrige los campos marcados, varón.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${endpoint}api/songs/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    author: author.trim(),
                    genre: genre.trim() || null,
                    structure: { parts }
                }),
            });

            const resData = await res.json();
            if (!res.ok) throw new Error(resData.message || "Error guardando");

            notify.success("¡Canción guardada con éxito!");
            router.push("/songs");
        } catch (err: any) {
            notify.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col lg:flex-row gap-8 relative overflow-x-hidden">

            {/* LADO IZQUIERDO: FORMULARIO */}
            <motion.div
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="flex-1 flex flex-col gap-6"
            >
                <div className="border-b border-slate-800/80 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                            Creador Armónico de Canciones
                        </h1>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Inyección secuencial exacta por clicks o escaneo por IA
                        </p>
                    </div>

                    <motion.label
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer flex items-center gap-2 transition-colors shadow-md ${processingImage
                            ? "bg-indigo-950/60 border-indigo-500 text-indigo-300"
                            : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-indigo-600/10"
                            }`}
                    >
                        {processingImage ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Escaneando...
                            </>
                        ) : (
                            <>
                                <Camera className="w-3.5 h-3.5" /> Escanear Cancionero
                            </>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={processingImage}
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </motion.label>
                </div>

                {/* PANEL DE ACCIÓN DEL INYECTOR */}
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/80 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Zap className={`w-3.5 h-3.5 ${isSelectionMode ? "text-amber-400 animate-pulse" : "text-slate-500"}`} />
                            Inyector Automático ({selectedIndices.length} clics)
                        </span>

                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIndices([]); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all border flex items-center gap-1.5 ${isSelectionMode
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-slate-950 border-slate-800 text-slate-300 hover:border-indigo-500/50"
                                }`}
                        >
                            <MousePointer className="w-3.5 h-3.5" />
                            {isSelectionMode ? "Salir de Modo Click" : "Activar Modo Click"}
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {isSelectionMode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -5 }}
                                animate={{ opacity: 1, height: "auto", y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -5 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="flex flex-col sm:flex-row gap-2 mt-1 overflow-hidden"
                            >
                                <input
                                    type="text"
                                    value={chordSequenceInput}
                                    onChange={(e) => setChordSequenceInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") applyChordSequence(); }}
                                    placeholder="Ej: C Am F G (Presiona Enter)"
                                    className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/5 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={applyChordSequence}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase rounded-lg shadow-md shadow-emerald-950/20 transition-colors"
                                >
                                    Inyectar
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* METADATOS METIDOS EN RETÍCULA */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800/60 shadow-xl">

                        {/* INPUT NOMBRE */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Título de la Canción *</label>
                            <input
                                name="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: La Única Razón"
                                className={`w-full bg-slate-950/60 border rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.name ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                    }`}
                            />
                            <AnimatePresence>
                                {errors.name && (
                                    <motion.span variants={errorFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-[10px] font-bold text-rose-400 px-1 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.name}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* INPUT AUTOR */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Autor / Intérprete *</label>
                            <input
                                name="author"
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                placeholder="Ej: Danilo Montero"
                                className={`w-full bg-slate-950/60 border rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.author ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                    }`}
                            />
                            <AnimatePresence>
                                {errors.author && (
                                    <motion.span variants={errorFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-[10px] font-bold text-rose-400 px-1 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.author}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* INPUT GÉNERO */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Género Musical</label>
                            <input
                                name="genre"
                                type="text"
                                value={genre}
                                onChange={(e) => setGenre(e.target.value)}
                                placeholder="Ej: Adoración"
                                className={`w-full bg-slate-950/60 border rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:ring-4 transition-all duration-300 ${errors.genre ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/5" : "border-slate-800 focus:border-indigo-500/70 focus:ring-indigo-500/5"
                                    }`}
                            />
                            <AnimatePresence>
                                {errors.genre && (
                                    <motion.span variants={errorFadeVariant} initial="hidden" animate="visible" exit="hidden" className="text-[10px] font-bold text-rose-400 px-1 mt-0.5 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> {errors.genre}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* BLOQUES DE TEXTO ANIMADOS CON LAYOUT */}
                    <motion.div layout className="flex flex-col gap-4">
                        <AnimatePresence initial={false}>
                            {parts.map((part, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                    transition={{ type: "spring", stiffness: 240, damping: 22 }}
                                    className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-2 shadow-md backdrop-blur-sm"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">{part.title}</span>
                                        {parts.length > 1 && (
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setParts(parts.filter((_, i) => i !== index))}
                                                className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300 flex items-center gap-1 bg-rose-500/5 border border-rose-500/10 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" /> Eliminar Bloque
                                            </motion.button>
                                        )}
                                    </div>
                                    <textarea
                                        value={part.content}
                                        onChange={(e) => {
                                            const updated = [...parts];
                                            updated[index].content = e.target.value;
                                            setParts(updated);
                                        }}
                                        onClick={(e) => handleTextareaClick(index, e)}
                                        rows={6}
                                        className={`w-full bg-slate-950/80 border rounded-lg p-3 text-sm font-mono leading-relaxed transition-all duration-300 focus:outline-none ${isSelectionMode
                                            ? "border-amber-500/50 bg-amber-950/10 cursor-crosshair focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5"
                                            : "border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5"
                                            }`}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {/* BOTONES DE CONTROL DE ABAJO */}
                    <div className="flex justify-between items-center mt-2">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setParts([...parts, { title: `Estrofa ${parts.length + 1}`, content: "" }])}
                            className="bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700/80 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md"
                        >
                            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Añadir Nueva Sección
                        </motion.button>

                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <GenericButton color="primary">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5">
                                        <Save className="w-4 h-4" /> Guardar Cifrado Final
                                    </span>
                                )}
                            </GenericButton>
                        </motion.div>
                    </div>
                </form>
            </motion.div>

            {/* LADO DERECHO: PREVISUALIZADOR ESTÁTICO REACTIVO */}
            <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
                className="w-full lg:w-[440px] flex flex-col gap-4 lg:sticky lg:top-8 h-fit"
            >
                <ChordLyricPreviewer structure={{ parts }} songName={name} author={author} />
            </motion.div>

            <ChatBotFAB>
                {({ closeChat }: any) => <SongChatAssistant closeChat={closeChat} onUpdateStructure={(newParts) => setParts(newParts)} />}
            </ChatBotFAB>
        </div>
    );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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

const VALID_CHORDS = new Set([
    "C", "D", "E", "F", "G", "A", "B",
    "Cm", "Dm", "Em", "Fm", "Gm", "Am", "Bm",
    "C#", "F#", "G#", "Bb", "Eb",
    "C#m", "F#m", "G#m"
]);

export default function CreateSongPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [processingImage, setProcessingImage] = useState(false);

    // Estados del Formulario (Alineados con el Flask body)
    const [name, setName] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [parts, setParts] = useState<SongPart[]>([
        { title: "Estrofa 1", content: "En tu [C]nombre hoy venimos\nEstamos tan [Am]agradecidos" }
    ]);

    // Estados del Inyector por clicks
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Array<{ partIdx: number; charPos: number }>>([]);
    const [chordSequenceInput, setChordSequenceInput] = useState("");

    // Manejador de la carga de imágenes con acople perfecto a routes/songs.py
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProcessingImage(true);
        notify.success("Procesando imagen con el Motor de Visión...");

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            try {
                // String Base64 sin prefijos
                const base64Raw = (reader.result as string).split(",")[1];

                // CORRECCIÓN: Ruta exacta '/upload-vision' del Blueprint
                const res = await fetch(`${endpoint}api/songs/upload-vision`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image_base64: base64Raw }), // CORRECCIÓN: 'image_base64'
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.error || "Error en el escaneo del cifrado.");
                }

                const data = await res.json();

                // CORRECCIÓN: Tu back responde 'detected_name' y 'structure'
                if (data.structure) {
                    setName(data.detected_name || "");
                    if (data.structure.parts) {
                        setParts(data.structure.parts);
                    }
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
        if (!name.trim() || !author.trim()) {
            notify.error("Faltan campos obligatorios para el backend, mano.");
            return;
        }

        setLoading(true);
        try {
            // CORRECCIÓN: Envío de payloads mapeado exacto al POST del Back
            const res = await fetch(`${endpoint}api/songs/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    author: author.trim(), // CORRECCIÓN: 'author' en vez de 'author_name'
                    genre: genre.trim() || null, // CORRECCIÓN: 'genre' en vez de 'genre_name'
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
        <div className="max-w-7xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col lg:flex-row gap-8 relative">

            {/* LADO IZQUIERDO: FORMULARIO */}
            <div className="flex-1 flex flex-col gap-6">
                <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">Creador Armónico de Canciones</h1>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mt-1">
                            Inyección secuencial exacta por clicks o escaneo por IA
                        </p>
                    </div>

                    <label className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border cursor-pointer flex items-center gap-2 transition-all shadow-md ${processingImage
                        ? "bg-indigo-950 border-indigo-500 text-indigo-300 animate-pulse"
                        : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                        }`}>
                        {processingImage ? "⏳ Escaneando..." : "📷 Escanear Cancionero"}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={processingImage}
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* PANEL DE ACCIÓN */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 shadow-md">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            ⚙️ Inyector Automático ({selectedIndices.length} clicks registrados)
                        </span>
                        <button
                            type="button"
                            onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedIndices([]); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all border ${isSelectionMode
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-slate-950 border-slate-700 text-slate-300 hover:border-indigo-500"
                                }`}
                        >
                            {isSelectionMode ? "🛑 Salir de Modo Click" : "🖱️ Activar Modo Click"}
                        </button>
                    </div>

                    {isSelectionMode && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-1">
                            <input
                                type="text"
                                value={chordSequenceInput}
                                onChange={(e) => setChordSequenceInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") applyChordSequence(); }}
                                placeholder="Ej: C Am F G (Enter)"
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                            />
                            <button type="button" onClick={applyChordSequence} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-black uppercase rounded-lg">
                                Inyectar
                            </button>
                        </div>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* METADATOS OBLIGATORIOS CONECTADOS AL BACK */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-inner">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Título de la Canción</label>
                            <input name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: La Única Razón" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Autor / Intérprete</label>
                            <input name="author" type="text" required value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Ej: Danilo Montero" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 pl-1">Género Musical</label>
                            <input name="genre" type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Ej: Adoración" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-indigo-500" />
                        </div>
                    </div>

                    {/* BLOQUES DE TEXTO */}
                    <div className="flex flex-col gap-4">
                        {parts.map((part, index) => (
                            <div key={index} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col gap-2 shadow-md">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-indigo-400 uppercase">{part.title}</span>
                                    {parts.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => setParts(parts.filter((_, i) => i !== index))}
                                            className="text-[10px] font-black uppercase text-rose-400 hover:text-rose-300"
                                        >
                                            Eliminar Bloque
                                        </button>
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
                                    className={`w-full bg-slate-950 border rounded-lg p-3 text-sm font-mono leading-relaxed transition-all focus:outline-none ${isSelectionMode
                                        ? "border-amber-500/40 bg-amber-950/5 cursor-crosshair"
                                        : "border-slate-700 focus:ring-1 focus:ring-indigo-500"
                                        }`}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            onClick={() => setParts([...parts, { title: `Estrofa ${parts.length + 1}`, content: "" }])}
                            className="bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                        >
                            ➕ Añadir Nueva Sección
                        </button>
                        <GenericButton color="primary">
                            {loading ? "Guardando..." : "Guardar Cifrado Final"}
                        </GenericButton>
                    </div>
                </form>
            </div>

            {/* LADO DERECHO: EL PREVISUALIZADOR */}
            <div className="w-full lg:w-[440px] flex flex-col gap-4 lg:sticky lg:top-8 h-fit">
                <ChordLyricPreviewer structure={{ parts }} songName={name} author={author} />
            </div>

            <ChatBotFAB>
                {({ closeChat }: any) => <SongChatAssistant closeChat={closeChat} onUpdateStructure={(newParts) => setParts(newParts)} />}
            </ChatBotFAB>
        </div>
    );
}
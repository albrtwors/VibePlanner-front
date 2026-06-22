// components/pages/songs/edit/page.tsx
"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GenericButton from "@/components/buttons/GenericButton";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import VibeHelperChat from "@/components/chatbot/SongHelperChat";
import SongStructureInput from "@/components/forms/SongStructureInput";
import SongStructureViewer from "@/components/songs/SongStructureViewer";
import { parseRawTextToStructure } from "@/utils/songParser";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface SongPart {
    title: string;
    content: string;
}

interface SongStructure {
    name: string;
    author: string;
    genre: string;
    structure: { parts: SongPart[] };
}

interface EditSongPageProps {
    params: Promise<{ id: string }>;
}

export default function EditSongPageClient({ params }: EditSongPageProps) {
    const { id } = use(params);
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [structureText, setStructureText] = useState("");

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Precargar datos desde Flask
    useEffect(() => {
        const fetchSongData = async () => {
            try {
                const res = await fetch(`${endpoint}/api/songs/${id}`);
                if (!res.ok) throw new Error("No se pudo obtener la información de la canción");

                const data = await res.json();

                setTitle(data.name);
                // Si el backend devuelve campos null para autor o género, los pasamos a string vacío
                setAuthor(data.author || "");
                setGenre(data.genre || "");

                if (data.structure && data.structure.parts) {
                    const formattedText = data.structure.parts
                        .map((part: SongPart) => `[${part.title.toUpperCase()}]\n${part.content}`)
                        .join("\n\n");
                    setStructureText(formattedText);
                }
            } catch (error) {
                console.error(error);
                notify.error("Error al precargar los datos de la canción.");
            }
            finally {
                setLoading(false);
            }
        };

        fetchSongData();
    }, [id]);

    // Función callback idéntica para rellenar datos desde el chat de IA
    const handleAutofillFromAI = (songData: SongStructure) => {
        setTitle(songData.name);
        setAuthor(songData.author);
        setGenre(songData.genre || "");

        const formattedText = songData.structure.parts
            .map((part) => `[${part.title.toUpperCase()}]\n${part.content}`)
            .join("\n\n");

        setStructureText(formattedText);
        notify.success("¡Datos e itinerario mapeados con éxito!");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !author || !structureText) {
            notify.error("Por favor, completa los campos requeridos (*).");
            return;
        }

        setIsSubmitting(true);
        const finalJsonStructure = parseRawTextToStructure(structureText);

        try {
            const response = await fetch(`${endpoint}/api/songs/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: title,
                    author: author,
                    genre: genre,
                    structure: finalJsonStructure
                })
            });

            if (response.ok) {
                notify.success(`¡Canción "${title}" actualizada correctamente!`);
                router.push("/songs");
                router.refresh();
            } else {
                notify.error("Error del servidor al actualizar la canción.");
            }
        } catch (error) {
            notify.error("No se pudo conectar con el servidor de Flask.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
                <div className="text-sm text-slate-500 animate-pulse">
                    Cargando datos de edición...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative pb-24 selection:bg-indigo-500/30">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col gap-8 relative z-10">
                <div className="flex items-center gap-5 border-b border-slate-800/80 pb-8">
                    <Link href="/songs" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
                            Editar Canción
                        </h1>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 sm:p-10 rounded-2xl border border-slate-800/60 backdrop-blur-md shadow-2xl">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Título <span className="text-indigo-400">*</span></label>
                        <input type="text" required placeholder="..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Autor / Artista <span className="text-indigo-400">*</span></label>
                        <input type="text" required placeholder="..." value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Género <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                        <input type="text" placeholder="..." value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <SongStructureInput value={structureText} onChange={setStructureText} required />

                    <div className="flex items-center justify-end gap-4 md:col-span-2 mt-4 border-t border-slate-800/60 pt-6">
                        <Link href="/songs" className="text-sm text-slate-400 hover:text-slate-200 px-2 transition-colors">
                            Cancelar
                        </Link>
                        <GenericButton color="primary">
                            {isSubmitting ? "Actualizando..." : "Guardar Cambios"}
                        </GenericButton>
                    </div>
                </form>

                {structureText.trim() && (
                    <SongStructureViewer structure={parseRawTextToStructure(structureText)} />
                )}
            </div>

            {/* Reincorporado el asistente de IA tal cual lo tenías en create */}
            <ChatBotFAB>
                {({ closeChat }) => (
                    <VibeHelperChat closeChat={closeChat} onApplyStructure={handleAutofillFromAI} />
                )}
            </ChatBotFAB>
        </div>
    );
}
// app/songs/create/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import GenericButton from "@/components/buttons/GenericButton";
import ChatBotFAB from "@/components/chatbot/ChatbotFAB";
import VibeHelperChat from "@/components/chatbot/SongHelperChat";
import SongStructureInput from "@/components/forms/SongStructureInput";
import SongStructureViewer from "@/components/songs/SongStructureViewer";
import { parseRawTextToStructure } from "@/utils/songParser";
import { notify } from "@/utils/toast";

interface SongStructure {
    name: string;
    author: string;
    genre: string;
    structure: { parts: Array<{ title: string; content: string }> };
}

export default function CreateSongPage() {
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [genre, setGenre] = useState("");
    const [structureText, setStructureText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const response = await fetch("http://127.0.0.1:5000/songs/", {
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
            } else {
                notify.error("Error del servidor al guardar la canción.");
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
                <div className="flex items-center gap-5 border-b border-slate-800/80 pb-8">
                    <Link href="/songs" className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </Link>
                    <div><h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">Crear Nueva Canción</h1></div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/30 p-6 sm:p-10 rounded-2xl border border-slate-800/60 backdrop-blur-md shadow-2xl">
                    <div className="flex flex-col gap-2 md:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Título <span className="text-indigo-400">*</span></label>
                        <input type="text" required placeholder="Ej. De Música Ligera..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Autor / Artista <span className="text-indigo-400">*</span></label>
                        <input type="text" required placeholder="Ej. Soda Stereo" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Género <span className="text-slate-600 font-normal lowercase">(opcional)</span></label>
                        <input type="text" placeholder="Ej. Rock" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-indigo-500 transition-all" />
                    </div>

                    <SongStructureInput value={structureText} onChange={setStructureText} required />

                    <div className="flex items-center justify-end gap-4 md:col-span-2 mt-4 border-t border-slate-800/60 pt-6">
                        <GenericButton color="primary" >
                            {isSubmitting ? "Guardando..." : "Guardar Canción"}
                        </GenericButton>
                    </div>
                </form>

                {structureText.trim() && (
                    <SongStructureViewer structure={parseRawTextToStructure(structureText)} />
                )}
            </div>

            <ChatBotFAB>
                {({ closeChat }) => (
                    <VibeHelperChat closeChat={closeChat} onApplyStructure={handleAutofillFromAI} />
                )}
            </ChatBotFAB>
        </div>
    );
}
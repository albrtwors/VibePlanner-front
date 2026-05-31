"use client";
import GenericButton from "@/components/buttons/GenericButton";

interface SongCardProps {
    title: string;
    artist: string;
    keySignature?: string;
    bpm?: number;
    onEdit?: () => void;
    onDelete?: () => void;
}

export default function SongCard({
    title,
    artist,
    keySignature = "N/A",
    bpm,
    onEdit,
    onDelete,
}: SongCardProps) {
    return (
        <div className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/80 transition-all duration-200 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/10">

            {/* Información de la Canción */}
            <div className="flex flex-col gap-2">
                <div>
                    <h3 className="text-xl font-semibold text-slate-100 tracking-wide">{title}</h3>
                    <p className="text-sm text-slate-400">{artist}</p>
                </div>

                {/* Badges / Metadatos */}
                <div className="flex gap-2 text-xs font-medium">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        Tono: {keySignature}
                    </span>
                    {bpm && (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {bpm} BPM
                        </span>
                    )}
                </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 sm:self-center self-end">
                <GenericButton
                    onClick={onEdit}
                    color="primary"
                >
                    Editar
                </GenericButton>
                <GenericButton
                    onClick={onDelete}
                    color="danger"
                >
                    Eliminar
                </GenericButton>
            </div>
        </div>
    );
}
// utils/songStatus.ts
//
// Metadatos de presentación del ciclo de vida de una canción. Los estados
// tienen que coincidir con models.SONG_STATUSES del backend.

export type SongStatus =
    | "borrador"
    | "en_revision"
    | "aprobada"
    | "rechazada"
    | "publicada";

interface StatusMeta {
    label: string;
    className: string;
}

const FALLBACK: StatusMeta = {
    label: "Desconocido",
    className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export const SONG_STATUS_META: Record<SongStatus, StatusMeta> = {
    borrador: {
        label: "Borrador",
        className: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    },
    en_revision: {
        label: "En revisión",
        className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    aprobada: {
        label: "Aprobada",
        className: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    },
    rechazada: {
        label: "Rechazada",
        className: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    },
    publicada: {
        label: "Publicada",
        className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
};

export function songStatusMeta(status?: string | null): StatusMeta {
    if (!status) return FALLBACK;
    return (SONG_STATUS_META as Record<string, StatusMeta>)[status] || FALLBACK;
}

export const SONG_STATUS_OPTIONS: { value: SongStatus; label: string }[] = [
    { value: "borrador", label: "Borrador" },
    { value: "en_revision", label: "En revisión" },
    { value: "aprobada", label: "Aprobada" },
    { value: "rechazada", label: "Rechazada" },
    { value: "publicada", label: "Publicada" },
];

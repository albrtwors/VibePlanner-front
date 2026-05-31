// components/forms/SongStructureInput.tsx
"use client";

interface SongStructureInputProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
}

export default function SongStructureInput({ value, onChange, required = false }: SongStructureInputProps) {
    return (
        <div className="flex flex-col gap-2 md:col-span-2">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estructura / Letra de la Canción {required && <span className="text-indigo-400">*</span>}
                </label>
                <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                    Modo: Marcadores Admitidos [Verso] [Coro]
                </span>
            </div>
            <textarea
                required={required}
                rows={11}
                placeholder={`[INTRO]\n(Instrumental)\n\n[VERSO 1]\nElla durmió al calor de las masas...\n\n[CORO]\nDe aquel amor de música ligera...`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-mono leading-relaxed resize-y shadow-inner"
            />
        </div>
    );
}
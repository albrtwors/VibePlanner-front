"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface SimpleCaptchaProps {
    onValidChange: (valid: boolean) => void;
    resetKey?: number;
}

function generateCaptcha(): { question: string; answer: string } {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const ops = ["+", "×"] as const;
    const op = ops[Math.floor(Math.random() * ops.length)];
    if (op === "+") {
        return { question: `${a} + ${b} = ?`, answer: String(a + b) };
    }
    return { question: `${a} × ${b} = ?`, answer: String(a * b) };
}

export default function SimpleCaptcha({ onValidChange, resetKey = 0 }: SimpleCaptchaProps) {
    const [captcha, setCaptcha] = useState(() => generateCaptcha());
    const [value, setValue] = useState("");

    const regenerate = useCallback(() => {
        const next = generateCaptcha();
        setCaptcha(next);
        setValue("");
        onValidChange(false);
    }, [onValidChange]);

    useEffect(() => {
        regenerate();
    }, [resetKey, regenerate]);

    const valid = useMemo(() => value.trim() === captcha.answer, [value, captcha.answer]);

    useEffect(() => {
        onValidChange(valid);
    }, [valid, onValidChange]);

    return (
        <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Verificación humana</label>
            <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 text-center font-mono text-lg font-bold tracking-widest text-slate-900 dark:text-slate-100 select-none">
                    {captcha.question}
                </div>
                <button
                    type="button"
                    onClick={regenerate}
                    className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    title="Actualizar captcha"
                >
                    ↻
                </button>
            </div>
            <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={value}
                onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Respuesta"
                className="w-full rounded-xl bg-white dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
            />
            {value && !valid && <p className="text-[10px] font-bold text-rose-500">Respuesta incorrecta</p>}
        </div>
    );
}

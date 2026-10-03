"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Mail,
    Lock,
    ArrowLeft,
    ArrowRight,
    Loader2,
    ShieldAlert,
    CheckCircle2,
    KeyRound,
    RotateCw,
    Send,
} from "lucide-react";

type Step = "email" | "code" | "newPassword" | "done";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [info, setInfo] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [devCode, setDevCode] = useState<string | null>(null);

    const codeInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setError("Introducí un correo electrónico válido.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "No se pudo enviar el código.");
            }

            setDevCode(data.dev_code ?? null);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setError(null);
            setStep("code");
            setTimeout(() => codeInputRef.current?.focus(), 120);
        } catch (err: any) {
            setError(err.message || "Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();

        if (code.length !== 6) {
            setError("El código tiene 6 dígitos.");
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth/verify-code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "El código no es válido.");
            }

            setCode("");
            setStep("newPassword");
        } catch (err: any) {
            setError(err.message || "No se pudo validar el código.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "No se pudo reenviar el código.");
            }

            setDevCode(data.dev_code ?? null);
            setCooldown(RESEND_COOLDOWN_SECONDS);
            setInfo("Te enviamos un código nuevo. Revisá tu correo.");
            setTimeout(() => codeInputRef.current?.focus(), 120);
        } catch (err: any) {
            setError(err.message || "No se pudo reenviar el código.");
        } finally {
            setResendLoading(false);
        }
    };

    const validatePassword = () => {
        const errs: { password?: string; confirmPassword?: string } = {};
        if (!password) {
            errs.password = "La contraseña es obligatoria.";
        } else if (password.length < 6) {
            errs.password = "La contraseña debe tener al menos 6 caracteres.";
        }
        if (password !== confirmPassword) {
            errs.confirmPassword = "Las contraseñas no coinciden, revisá bien.";
        }
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validatePassword()) return;

        setLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, confirm_password: confirmPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "No se pudo actualizar la contraseña.");
            }

            setPassword("");
            setConfirmPassword("");
            setStep("done");
        } catch (err: any) {
            setError(err.message || "Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    const restart = () => {
        setStep("email");
        setEmail("");
        setCode("");
        setError(null);
        setInfo(null);
        setDevCode(null);
        setCooldown(0);
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 overflow-hidden text-slate-100 selection:bg-indigo-500/30">
            {/* Glows de fondo */}
            <div className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/20 p-8 backdrop-blur-xl shadow-2xl"
            >
                {/* Cabecera */}
                <div className="flex flex-col items-center space-y-2.5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-2xl shadow-xl shadow-indigo-500/10">
                        V
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                            Vibe<span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Planner</span>
                        </h1>
                        <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mt-1">
                            {step === "email" && "Recuperar Acceso"}
                            {step === "code" && "Validar Código"}
                            {step === "newPassword" && "Nueva Contraseña"}
                            {step === "done" && "Contraseña Actualizada"}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 rounded-xl bg-rose-500/5 p-3.5 text-xs font-bold text-rose-400 border border-rose-500/10">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{error}</span>
                    </div>
                )}

                {/* ======================================================
                    PASO 1 · PEDIR EL CÓDIGO
                    ====================================================== */}
                {step === "email" && (
                    <form onSubmit={handleSendCode} className="space-y-4">
                        <p className="text-xs font-bold leading-relaxed text-slate-400">
                            Escribí el correo con el que te registraste y te mandamos un código para que puedas elegir una
                            contraseña nueva.
                        </p>

                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <Mail className="w-3 h-3" /> Correo Electrónico
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300"
                                placeholder="tu@correo.com"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Enviando código...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                    Enviar Código <Send className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </motion.button>
                    </form>
                )}

                {/* ======================================================
                    PASO 2 · INGRESAR EL CÓDIGO
                    ====================================================== */}
                {step === "code" && (
                    <form onSubmit={handleVerifyCode} className="space-y-4">
                        <div className="flex items-start gap-2.5 rounded-xl bg-indigo-500/5 p-3.5 text-xs font-bold text-indigo-300 border border-indigo-500/10">
                            <Mail className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                            <span>
                                Mandamos un código de 6 dígitos a <strong className="text-white">{email}</strong>.
                            </span>
                        </div>

                        {devCode && (
                            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs font-bold text-amber-300">
                                Modo desarrollo (sin SMTP configurado): tu código es{" "}
                                <span className="font-mono text-base tracking-widest">{devCode}</span>
                            </div>
                        )}

                        {info && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/5 p-3.5 text-xs font-bold text-emerald-400 border border-emerald-500/10">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                                <span>{info}</span>
                            </div>
                        )}

                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <KeyRound className="w-3 h-3" /> Código de Seguridad
                            </label>
                            <input
                                ref={codeInputRef}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className={`w-full rounded-xl bg-slate-950/80 border px-4 py-4 text-center font-mono text-2xl tracking-[0.6em] text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 ${error ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                    }`}
                                placeholder="000000"
                            />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading || code.length !== 6}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Validando código...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                    Validar Código <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </motion.button>

                        <div className="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                onClick={restart}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-400 transition-colors"
                            >
                                <ArrowLeft className="w-3 h-3" /> Otro correo
                            </button>

                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resendLoading || cooldown > 0}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                            >
                                {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
                                {cooldown > 0 ? `Reenviar (${cooldown}s)` : "Reenviar código"}
                            </button>
                        </div>
                    </form>
                )}

                {/* ======================================================
                    PASO 3 · ELEGIR LA NUEVA CONTRASEÑA
                    ====================================================== */}
                {step === "newPassword" && (
                    <form onSubmit={handleReset} className="space-y-4">
                        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/5 p-3.5 text-xs font-bold text-emerald-400 border border-emerald-500/10">
                            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                            <span>Código validado. Ahora elegí tu contraseña nueva.</span>
                        </div>

                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <Lock className="w-3 h-3" /> Contraseña Nueva
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono ${fieldErrors.password ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                    }`}
                                placeholder="Mínimo 6 caracteres"
                            />
                            {fieldErrors.password && (
                                <p className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5 group">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <Lock className="w-3 h-3" /> Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono ${fieldErrors.confirmPassword ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                    }`}
                                placeholder="••••••••"
                            />
                            {fieldErrors.confirmPassword && (
                                <p className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1">
                                    {fieldErrors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Guardando contraseña...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                    Guardar Contraseña <CheckCircle2 className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </motion.button>
                    </form>
                )}

                {/* ======================================================
                    PASO 4 · LISTO
                    ====================================================== */}
                {step === "done" && (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center gap-3 rounded-xl bg-emerald-500/5 p-6 text-center border border-emerald-500/10">
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                            <p className="text-sm font-black text-emerald-300">¡Contraseña actualizada con éxito!</p>
                            <p className="text-xs font-bold text-slate-400">Ya podés iniciar sesión con tu contraseña nueva.</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500"
                        >
                            Ir al Login
                        </button>

                        <button
                            type="button"
                            onClick={restart}
                            className="w-full flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                            <RotateCw className="w-3 h-3" /> Recuperar otra cuenta
                        </button>
                    </div>
                )}

                {/* Link al login */}
                {step !== "done" && (
                    <div className="pt-4 text-center text-xs font-bold text-slate-500 border-t border-slate-800/60 flex items-center justify-center gap-1">
                        <span>¿TE ACORDÁS DE TU CLAVE?</span>
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 uppercase tracking-wide font-black transition-colors pl-0.5">
                            Inicia sesión
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
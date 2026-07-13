"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Lock, UserPlus, Loader2, ShieldAlert, AlertCircle } from "lucide-react";

interface FormErrors {
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    global?: string;
}

export default function RegisterPage() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // 1. Validación Estricta de Usuario
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,}$/;
        if (!username) {
            newErrors.username = "El nombre de usuario es obligatorio.";
        } else if (username.length < 5) {
            newErrors.username = "Debe tener al menos 5 caracteres, mano.";
        } else if (!/^[a-zA-Z]/.test(username)) {
            newErrors.username = "Debe empezar obligatoriamente con una letra.";
        } else if (!usernameRegex.test(username)) {
            newErrors.username = "Solo se permiten letras, números y guiones bajos (_).";
        }

        // 2. Validación de Correo
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            newErrors.email = "El correo electrónico es obligatorio.";
        } else if (!emailRegex.test(email)) {
            newErrors.email = "Por favor, introduce un correo electrónico válido.";
        }

        // 3. Validación de Contraseña
        if (!password) {
            newErrors.password = "La contraseña es obligatoria.";
        } else if (password.length < 6) {
            newErrors.password = "La contraseña debe tener al menos 6 caracteres.";
        }

        // 4. Confirmación
        if (password !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden, revisá bien.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!validateForm()) return;

        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "No se pudo crear la cuenta, mano.");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setErrors({ global: err.message || "Error al conectar con el servidor." });
        } finally {
            setLoading(false);
        }
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
                            Crear Nueva Cuenta
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {errors.global && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2.5 rounded-xl bg-rose-500/5 p-3.5 text-xs font-bold text-rose-400 border border-rose-500/10"
                            >
                                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                                <span>{errors.global}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Usuario */}
                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <User className="w-3 h-3" /> Nombre de Usuario
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 ${errors.username ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                }`}
                            placeholder="Ej: juan_perez"
                        />
                        <AnimatePresence>
                            {errors.username && (
                                <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-500" /> {errors.username}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Correo */}
                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> Correo Electrónico
                        </label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 ${errors.email ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                }`}
                            placeholder="tu@correo.com"
                        />
                        <AnimatePresence>
                            {errors.email && (
                                <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-500" /> {errors.email}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <Lock className="w-3 h-3" /> Contraseña
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono ${errors.password ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                }`}
                            placeholder="Mínimo 6 caracteres"
                        />
                        <AnimatePresence>
                            {errors.password && (
                                <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-500" /> {errors.password}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="space-y-1.5 group">
                        <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 pl-0.5 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                            <Lock className="w-3 h-3" /> Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full rounded-xl bg-slate-950/80 border px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono ${errors.confirmPassword ? "border-rose-500/50 focus:border-rose-500" : "border-slate-800 focus:border-indigo-500/70"
                                }`}
                            placeholder="••••••••"
                        />
                        <AnimatePresence>
                            {errors.confirmPassword && (
                                <motion.p initial={{ opacity: 0, y: -2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] font-black uppercase tracking-wide text-rose-400 mt-1 pl-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-rose-500" /> {errors.confirmPassword}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Botón de Envío */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:pointer-events-none mt-2"
                    >
                        {loading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Configurando tu entorno...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1.5">
                                Registrarse e Ingresar <UserPlus className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </motion.button>
                </form>

                {/* Link a login */}
                <div className="pt-4 text-center text-xs font-bold text-slate-500 border-t border-slate-800/60 flex items-center justify-center gap-1">
                    <span>¿YA TENÉS CUENTA?</span>
                    <Link href="/login" className="text-indigo-400 hover:text-indigo-300 uppercase tracking-wide font-black transition-colors pl-0.5">
                        Inicia sesión
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
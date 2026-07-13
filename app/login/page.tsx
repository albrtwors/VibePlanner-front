"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Credenciales inválidas, mano.");
            }

            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 overflow-hidden text-slate-100 selection:bg-indigo-500/30">
            {/* Efectos de luces de fondo (Glows escénicos) */}
            <div className="absolute top-1/4 left-1/4 -z-10 h-80 w-80 rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 -z-10 h-80 w-80 rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800/80 bg-slate-900/20 p-8 backdrop-blur-xl shadow-2xl"
            >
                {/* Encabezado e Identidad de Marca */}
                <div className="flex flex-col items-center space-y-2.5 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-black text-2xl shadow-xl shadow-indigo-500/10">
                        V
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">
                            Vibe<span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Planner</span>
                        </h1>
                        <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase mt-1">
                            Panel de Autenticación Unificado
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2.5 rounded-xl bg-rose-500/5 p-3.5 text-xs font-bold text-rose-400 border border-rose-500/10"
                        >
                            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                            <span>{error}</span>
                        </motion.div>
                    )}

                    {/* Campo de Correo */}
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

                    {/* Campo de Contraseña */}
                    <div className="space-y-1.5 group">
                        <div className="flex items-center justify-between pl-0.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 group-focus-within:text-indigo-400 transition-colors flex items-center gap-1.5">
                                <Lock className="w-3 h-3" /> Contraseña
                            </label>
                            <a href="#" className="text-[10px] font-black uppercase tracking-wider text-slate-500 hover:text-indigo-400 transition-colors">
                                ¿La olvidaste?
                            </a>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-indigo-500/70 focus:ring-4 focus:ring-indigo-500/5 transition-all duration-300 font-mono"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Botón de Envío */}
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
                                <span>Verificando firmas...</span>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-1.5">
                                Acceder al Sistema <LogIn className="w-3.5 h-3.5" />
                            </div>
                        )}
                    </motion.button>
                </form>

                {/* Link a registro */}
                <div className="pt-4 text-center text-xs font-bold text-slate-500 border-t border-slate-800/60 flex items-center justify-center gap-1">
                    <span>¿NO TENÉS CUENTA?</span>
                    <Link href="/register" className="text-indigo-400 hover:text-indigo-300 uppercase tracking-wide font-black transition-colors pl-0.5">
                        Regístrate
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
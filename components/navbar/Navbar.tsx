"use client"; // VITAL: Convierte el componente al lado del cliente para usar hooks

import { usePathname } from "next/navigation";
import Link from "next/link"; // Usar Link de Next.js en lugar de <a> evita recargas de página completas

export default function Navbar() {
    const pathname = usePathname(); // Captura la ruta actual (ej: "/dashboard", "/songs")

    // Función auxiliar para verificar si el enlace está activo
    const isActive = (path: string) => pathname === path;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-4">

                    {/* 1. Logotipo / Marca */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20">
                            V
                        </div>
                        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                            Vibe<span className="text-indigo-400">Planner</span>
                        </span>
                    </div>

                    {/* 2. Enlaces de Navegación del Centro */}
                    <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                        <Link
                            href="/dashboard"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/dashboard")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Dashboard
                        </Link>

                        <Link
                            href="/events"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/events")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Eventos
                        </Link>
                        <Link
                            href="/expenses"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/expenses")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Gastos
                        </Link>
                        <Link
                            href="/songs"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/songs")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Canciones
                        </Link>
                        <Link
                            href="/chords/create"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/chords/create")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Armonizar
                        </Link>
                        <Link
                            href="/files"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/files")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Repertorio
                        </Link>


                        <Link
                            href="/inventory"
                            className={`rounded-lg px-3 py-2 transition-all ${isActive("/inventory")
                                ? "bg-slate-900 text-indigo-400 font-semibold border-b-2 border-indigo-500/50 rounded-b-none"
                                : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                }`}
                        >
                            Inventario
                        </Link>

                        {/* Botón de VibeAI con remarcado especial si está activo */}
                        <Link
                            href="/chatbot"
                            className={`rounded-lg px-3 py-2 transition-all flex items-center gap-1.5 border ${isActive("/chatbot")
                                ? "text-indigo-300 bg-indigo-500/20 border-indigo-400 shadow-md shadow-indigo-500/10 font-semibold"
                                : "text-indigo-400 bg-indigo-500/5 border-indigo-500/10 hover:bg-indigo-500/10"
                                }`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                            </span>
                            VibeAI
                        </Link>
                    </nav>

                    {/* 3. Botones de Acción de la Derecha */}
                    <div className="flex items-center gap-4">
                        <button className="hidden sm:inline-flex text-sm font-medium text-slate-400 hover:text-white transition-colors">
                            Soporte
                        </button>

                        {/* Botón Principal */}
                        <button className="relative group overflow-hidden rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-500 active:scale-95">
                            <span className="relative z-10">Nuevo Evento</span>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                        </button>

                        {/* Avatar */}
                        <div className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 cursor-pointer hover:border-slate-500 transition-colors" />
                    </div>

                </div>
            </div>
        </header>
    );
}
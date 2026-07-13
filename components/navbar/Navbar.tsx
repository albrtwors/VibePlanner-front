"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, LifeBuoy, PlusCircle } from "lucide-react";
import { getClientProfile } from "@/utils/proxy";

const PUBLIC_ROUTES = ["/login", "/register"];

// Variantes para el contenedor de la navegación (activa el retraso entre hijos)
const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04, // Tiempo entre la aparición de cada pestaña
            delayChildren: 0.05    // Espera inicial antes de arrancar
        }
    }
};

// Variantes para cada pestaña individual (Entrada de izquierda a derecha con rebote sutil)
const navItemVariants = {
    hidden: { opacity: 0, x: -15 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { type: "spring", stiffness: 260, damping: 20 }
    }
};

export default function Navbar() {
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        async function verifyUserRole() {
            const data = await getClientProfile();

            if (data && data.role) {
                setRole(data.role.toLowerCase());
            } else {
                setRole(null);
                if (!PUBLIC_ROUTES.includes(pathname)) {
                    router.push("/login");
                }
            }
            setLoading(false);
        }

        verifyUserRole();
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Error cerrando sesión:", err);
        } finally {
            setRole(null);
            router.push("/login");
            router.refresh();
        }
    };

    const allLinks = [
        { name: "Dashboard", href: "/dashboard", allowed: ["admin", "coordinator", "operator"] },
        { name: "Eventos", href: "/events", allowed: ["admin", "coordinator"] },
        { name: "Gastos", href: "/expenses", allowed: ["admin"] },
        { name: "Canciones", href: "/songs", allowed: ["admin", "coordinator", "operator"] },
        { name: "Armonizar", href: "/chords/create", allowed: ["admin", "coordinator", "operator"] },
        { name: "Repertorio", href: "/files", allowed: ["admin", "coordinator", "operator"] },
        { name: "Inventario", href: "/inventory", allowed: ["admin"] },
        { name: "VibeAI", href: "/chatbot", allowed: ["admin", "coordinator"], special: true },
    ];

    const visibleLinks = allLinks.filter(link => role && link.allowed.includes(role));

    if (loading) {
        return <div className="h-16 w-full bg-slate-950 border-b border-slate-800/60 animate-pulse" />;
    }

    // NAVBAR EN RUTAS PÚBLICAS (Login / Register)
    if (!role) {
        return (
            <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/login" className="flex items-center gap-2 group">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20 transition-transform duration-300 group-hover:rotate-12">V</div>
                            <span className="text-xl font-extrabold text-white">Vibe<span className="text-indigo-400">Planner</span></span>
                        </Link>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive("/login") ? "text-indigo-400" : "text-slate-400 hover:text-white"}`}
                            >
                                Iniciar sesión
                            </Link>
                            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                                <Link
                                    href="/register"
                                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20 transition-colors"
                                >
                                    Registrarme
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    // NAVBAR COMPLETA AUTENTICADA
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">

                    {/* Brand Logotipo */}
                    <div className="flex items-center gap-2 cursor-pointer">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20">V</div>
                        <span className="text-xl font-extrabold text-white">Vibe<span className="text-indigo-400">Planner</span></span>
                    </div>

                    {/* Navegación Desktop con Animación Secuencial de Izquierda a Derecha */}
                    <motion.nav
                        variants={navContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="hidden md:flex items-center gap-1 text-sm font-medium relative"
                    >
                        {visibleLinks.map((link) => {
                            const active = isActive(link.href);
                            return (
                                <motion.div
                                    key={link.href}

                                    whileHover={{ y: -1 }} // Micro-movimiento extra al pasar el mouse
                                    className="relative"
                                >
                                    <Link
                                        href={link.href}
                                        className={`relative block rounded-lg px-3 py-2 transition-colors duration-300 ${active ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-white"}`}
                                    >
                                        {active && (
                                            <motion.span
                                                layoutId="activeNavBackground"
                                                className="absolute inset-0 bg-slate-900/80 border-b border-indigo-500/40 rounded-lg -z-10"
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        {link.name}
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.nav>

                    {/* Controles Desktop */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="hidden md:flex items-center gap-3"
                    >
                        <button className="flex items-center gap-1 text-slate-400 hover:text-white text-sm transition-colors px-2 py-1">
                            <LifeBuoy className="w-4 h-4" /> Soporte
                        </button>

                        {(role === "admin" || role === "coordinator") && (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10 transition-colors"
                            >
                                <PlusCircle className="w-4 h-4" /> Nuevo Evento
                            </motion.button>
                        )}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="flex items-center gap-1.5 rounded-xl border border-slate-800 px-3.5 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900/30 transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Salir
                        </motion.button>
                    </motion.div>

                    {/* Botón de Menú Móvil */}
                    <button
                        className="md:hidden text-slate-400 hover:text-white focus:outline-none"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </motion.div>
                    </button>
                </div>
            </div>

            {/* Menú Desplegable Móvil Fluido */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="md:hidden bg-slate-950 border-b border-slate-800/80 overflow-hidden"
                    >
                        <motion.div
                            variants={navContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="px-4 pt-2 pb-6 space-y-1.5"
                        >
                            {visibleLinks.map((link) => (
                                <motion.div key={link.href}>
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(link.href)
                                            ? "bg-slate-900 text-indigo-400 border-l-2 border-indigo-500 pl-3"
                                            : "text-slate-400 hover:bg-slate-900/50 hover:text-white"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="border-t border-slate-900 my-2 pt-2" />
                            <button
                                onClick={() => { setIsOpen(false); handleLogout(); }}
                                className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-rose-400 hover:bg-rose-500/10 rounded-xl text-sm font-medium transition-all"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar sesión
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
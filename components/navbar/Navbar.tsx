"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu, X, LogOut, LifeBuoy, PlusCircle, Sun, Moon,
    Search, ChevronDown, LayoutDashboard, Calendar, DollarSign,
    Music, ShieldCheck, Wand2, FolderKanban, Package, Bot, Users, KeyRound
} from "lucide-react";
import { getClientProfile } from "@/utils/proxy";
import { hasPermission, roleLabel, ClientProfile } from "@/utils/permissions";
import { useTheme } from "@/components/theme/ThemeProvider";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

const navContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.04,
            delayChildren: 0.05
        }
    }
};

export default function Navbar() {
    const [profile, setProfile] = useState<ClientProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    // Estados para el Dropdown de "Más / Menú" y el Buscador
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const moreMenuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const role = profile?.role ?? null;
    const permissions = profile?.permissions ?? [];

    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();
    const isActive = (path: string) => pathname === path;

    useEffect(() => {
        async function verifyUserRole() {
            const data = await getClientProfile();

            if (data && data.role) {
                setProfile(data);
            } else {
                setProfile(null);
                if (!PUBLIC_ROUTES.includes(pathname)) {
                    router.push("/login");
                }
            }
            setLoading(false);
        }

        verifyUserRole();
    }, [pathname]);

    // Cerrar el dropdown de "Más" al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
                setIsMoreOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Atajo de teclado para abrir el buscador (Ctrl + K o Cmd + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsSearchOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setIsSearchOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Foco automático en el input cuando se abre el buscador
    useEffect(() => {
        if (isSearchOpen) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isSearchOpen]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", {
                method: "POST",
                credentials: "include",
            });
        } catch (err) {
            console.error("Error cerrando sesión:", err);
        } finally {
            setProfile(null);
            router.push("/login");
            router.refresh();
        }
    };

    // Listado completo con sus respectivos íconos para darle mejor UI
    const allLinks = [
        { name: "Dashboard", href: "/dashboard", requires: ["dashboard.view"], icon: LayoutDashboard },
        { name: "Eventos", href: "/events", requires: ["events.view"], icon: Calendar },
        { name: "Gastos", href: "/expenses", requires: ["expenses.view"], icon: DollarSign },
        { name: "Canciones", href: "/songs", requires: ["songs.view"], icon: Music },
        { name: "Moderación", href: "/songs/moderation", requires: ["songs.moderate"], icon: ShieldCheck },
        { name: "Armonizar", href: "/chords/create", requires: ["songs.edit"], icon: Wand2 },
        { name: "Repertorio", href: "/files", requires: ["files.view"], icon: FolderKanban },
        { name: "Inventario", href: "/inventory", requires: ["inventory.view"], icon: Package },
        { name: "VibeAI", href: "/chatbot", requires: ["ai.use"], icon: Bot },
    ];

    const adminLinks = [
        { name: "Usuarios", href: "/admin/users", requires: ["users.view"], icon: Users },
        { name: "Roles y Permisos", href: "/admin/roles", requires: ["roles.view"], icon: KeyRound },
    ];

    const visibleLinks = allLinks.filter(link => hasPermission(permissions, ...link.requires));
    const visibleAdminLinks = adminLinks.filter(link => hasPermission(permissions, ...link.requires));
    const canCreateEvent = hasPermission(permissions, "events.create");

    // Separamos enlaces principales fijos (primeros 4) y los demás van al dropdown "Más" para ahorrar espacio
    const primaryLinks = visibleLinks.slice(0, 4);
    const secondaryLinks = visibleLinks.slice(4);

    // Filtrar para el Buscador Global
    const allAvailableLinks = [...visibleLinks, ...visibleAdminLinks];
    const filteredSearchResults = searchQuery.trim() === ""
        ? []
        : allAvailableLinks.filter(link => link.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) {
        return <div className="h-16 w-full bg-slate-950 border-b border-slate-800/60 animate-pulse" />;
    }

    if (!role) {
        // (Tu sección pública se mantiene igual...)
        return null;
    }

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between gap-4">

                        {/* Brand Logotipo */}
                        <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer shrink-0">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg shadow-indigo-500/20">V</div>
                            <span className="text-xl font-extrabold text-slate-900 dark:text-white hidden sm:inline">Vibe<span className="text-indigo-400">Planner</span></span>
                        </Link>

                        {/* Navegación Desktop Optimizada */}
                        <motion.nav
                            variants={navContainerVariants}
                            initial="hidden"
                            animate="visible"
                            className="hidden md:flex items-center gap-1 text-sm font-medium relative"
                        >
                            {/* Enlaces Principales Fijos */}
                            {primaryLinks.map((link) => {
                                const active = isActive(link.href);
                                return (
                                    <motion.div key={link.href} whileHover={{ y: -1 }} className="relative">
                                        <Link
                                            href={link.href}
                                            className={`relative block rounded-lg px-3 py-2 transition-colors duration-300 ${active ? "text-indigo-400 font-semibold" : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"}`}
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

                            {/* Dropdown "Más" para agrupar secciones secundarias y admin */}
                            {(secondaryLinks.length > 0 || visibleAdminLinks.length > 0) && (
                                <div className="relative" ref={moreMenuRef}>
                                    <button
                                        onClick={() => setIsMoreOpen(!isMoreOpen)}
                                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-300 ${secondaryLinks.some(l => isActive(l.href)) || visibleAdminLinks.some(l => isActive(l.href))
                                                ? "text-indigo-400 font-semibold"
                                                : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        <span>Más</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
                                    </button>

                                    <AnimatePresence>
                                        {isMoreOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute left-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl py-2 z-50 overflow-hidden"
                                            >
                                                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Secciones</div>
                                                {secondaryLinks.map((link) => {
                                                    const Icon = link.icon;
                                                    return (
                                                        <Link
                                                            key={link.href}
                                                            href={link.href}
                                                            onClick={() => setIsMoreOpen(false)}
                                                            className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${isActive(link.href) ? "bg-slate-800 text-indigo-400 font-semibold" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                                                                }`}
                                                        >
                                                            {Icon && <Icon className="w-4 h-4 text-slate-400" />}
                                                            {link.name}
                                                        </Link>
                                                    );
                                                })}

                                                {visibleAdminLinks.length > 0 && (
                                                    <>
                                                        <div className="border-t border-slate-800 my-1.5" />
                                                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-500/80">Administración</div>
                                                        {visibleAdminLinks.map((link) => {
                                                            const Icon = link.icon;
                                                            return (
                                                                <Link
                                                                    key={link.href}
                                                                    href={link.href}
                                                                    onClick={() => setIsMoreOpen(false)}
                                                                    className={`flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${isActive(link.href) ? "bg-slate-800 text-amber-400 font-semibold" : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                                                                        }`}
                                                                >
                                                                    {Icon && <Icon className="w-4 h-4 text-amber-400" />}
                                                                    {link.name}
                                                                </Link>
                                                            );
                                                        })}
                                                    </>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </motion.nav>

                        {/* Controles Desktop (Buscador trigger + Tema + Acciones) */}
                        <div className="hidden md:flex items-center gap-3">
                            {/* Botón Abrir Buscador */}
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-xl text-xs transition-all shadow-inner"
                            >
                                <Search className="w-3.5 h-3.5 text-slate-400" />
                                <span>Buscar...</span>
                                <kbd className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">⌘K</kbd>
                            </button>

                            <button
                                onClick={toggleTheme}
                                className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg border border-transparent hover:border-slate-800"
                                title="Cambiar tema"
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>

                            {canCreateEvent && (
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/10 transition-colors"
                                >
                                    <PlusCircle className="w-4 h-4" /> Nuevo Evento
                                </motion.button>
                            )}

                            <span className="hidden xl:inline-flex items-center rounded-xl border border-slate-800 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                                {roleLabel(role || "")}
                            </span>

                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-rose-400 transition-colors rounded-xl border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/10"
                                title="Cerrar sesión"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Botón de Menú Móvil */}
                        <button
                            className="md:hidden text-slate-400 hover:text-white focus:outline-none"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Menú Desplegable Móvil */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-slate-950 border-b border-slate-800 overflow-hidden"
                        >
                            <div className="px-4 pt-3 pb-6 space-y-1">
                                <button
                                    onClick={() => { setIsOpen(false); setIsSearchOpen(true); }}
                                    className="flex items-center gap-2 w-full bg-slate-900 border border-slate-800 text-slate-400 px-3 py-2 rounded-xl text-sm mb-3"
                                >
                                    <Search className="w-4 h-4" /> Buscar en la app...
                                </button>

                                {visibleLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${isActive(link.href) ? "bg-slate-900 text-indigo-400 border-l-2 border-indigo-500" : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        {link.name}
                                    </Link>
                                ))}

                                {visibleAdminLinks.length > 0 && (
                                    <>
                                        <div className="border-t border-slate-900 my-2 pt-2" />
                                        <p className="px-4 text-[10px] font-bold uppercase text-amber-500">Administración</p>
                                        {visibleAdminLinks.map((link) => (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`block px-4 py-2.5 rounded-xl text-sm font-medium ${isActive(link.href) ? "bg-slate-900 text-amber-400 border-l-2 border-amber-500" : "text-slate-400 hover:text-white"
                                                    }`}
                                            >
                                                {link.name}
                                            </Link>
                                        ))}
                                    </>
                                )}

                                <div className="border-t border-slate-900 my-2 pt-2" />
                                <button
                                    onClick={() => { setIsOpen(false); toggleTheme(); }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-900"
                                >
                                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                                    Cambiar a {theme === "dark" ? "modo claro" : "modo oscuro"}
                                </button>
                                <button
                                    onClick={() => { setIsOpen(false); handleLogout(); }}
                                    className="flex items-center gap-2 w-full px-4 py-2 text-rose-400 text-sm font-medium rounded-xl hover:bg-rose-500/10"
                                >
                                    <LogOut className="w-4 h-4" /> Cerrar sesión
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* MODAL DE BÚSQUEDA RÁPIDA (Command Palette estilo Vercel / Raycast) */}
            <AnimatePresence>
                {isSearchOpen && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="flex items-center px-4 border-b border-slate-800">
                                <Search className="w-5 h-5 text-slate-400 mr-2" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Escribe para buscar secciones..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent py-4 text-white text-sm focus:outline-none placeholder:text-slate-500"
                                />
                                <button
                                    onClick={() => setIsSearchOpen(false)}
                                    className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-lg border border-slate-700 hover:text-white"
                                >
                                    ESC
                                </button>
                            </div>

                            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                                {searchQuery.trim() !== "" && filteredSearchResults.length === 0 ? (
                                    <p className="text-center py-6 text-sm text-slate-500">No se encontraron resultados para &quot;{searchQuery}&quot;</p>
                                ) : (
                                    filteredSearchResults.map((link) => {
                                        const Icon = link.icon;
                                        return (
                                            <Link
                                                key={link.href}
                                                href={link.href}
                                                onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                            >
                                                {Icon && <Icon className="w-4 h-4 text-indigo-400" />}
                                                <span>{link.name}</span>
                                            </Link>
                                        );
                                    })
                                )}
                                {searchQuery.trim() === "" && (
                                    <p className="text-center py-4 text-xs text-slate-500">Empieza a escribir para navegar rápidamente...</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
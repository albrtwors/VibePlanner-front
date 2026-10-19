// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiUrl } from "@/consts/backEndpoint";
import EventCharts, { EventForCharts } from "@/components/dashboard/EventCharts";

interface UpcomingEvent {
    id: number;
    name: string;
    date: string;
    time: string;
    target_audience: string;
    guests_count?: number;
    estimated_logistic_budget?: number;
    participants?: unknown[];
    staff?: unknown[];
}

interface DashboardData {
    stats: {
        totalSongs: number;
        aiGenerated: number;
        activeSetlists: number;
        upcomingEvents: number;
    };
    upcomingEvents: UpcomingEvent[];
    aiStatus: {
        provider: string;
        model: string;
        status: string;
        latency: string;
    };
    recentActivities: Array<{ id: number; type: string; text: string; time: string }>;
}

// Datos de respaldo del catálogo musical (módulos de canciones y cancioneros).
// Los eventos SÍ son reales: se consultan a GET /api/events?start_date=<hoy>.
const BASE_DATA = {
    stats: {
        totalSongs: 142,
        aiGenerated: 89,
        activeSetlists: 12,
        upcomingEvents: 0,
    },
    aiStatus: {
        provider: "Groq Cloud",
        model: "Llama 3.1 8B Instant",
        status: "Operational",
        latency: "140ms",
    },
    recentActivities: [
        { id: 1, type: "song", text: "Estructura de 'Persiana Americana' generada con IA.", time: "Hace 10 min" },
        { id: 2, type: "event", text: "Setlist para 'Boda de Carlos & Ana' coordinado.", time: "Hace 1 hora" },
        { id: 3, type: "cancionero", text: "Nuevo cancionero 'Acústicos Rock' creado.", time: "Hace 3 horas" },
    ],
};

function formatEventDate(dateStr: string): string {
    try {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    } catch {
        return dateStr;
    }
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData>({
        stats: { totalSongs: 142, aiGenerated: 89, activeSetlists: 12, upcomingEvents: 0 },
        upcomingEvents: [],
        aiStatus: { provider: "Groq Cloud", model: "Llama 3.1 8B Instant", status: "Operational", latency: "140ms" },
        recentActivities: [
            { id: 1, type: "song", text: "Estructura de 'Persiana Americana' generada con IA.", time: "Hace 10 min" },
            { id: 2, type: "event", text: "Setlist para 'Boda de Carlos & Ana' coordinado.", time: "Hace 1 hora" },
            { id: 3, type: "cancionero", text: "Nuevo cancionero 'Acústicos Rock' creado.", time: "Hace 3 horas" },
        ],
    });
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [allEvents, setAllEvents] = useState<EventForCharts[]>([]);

    useEffect(() => {
        const today = new Date().toISOString().slice(0, 10);
        fetch(apiUrl(`/api/events`))
            .then((res) => (res.ok ? res.json() : []))
            .then((events: UpcomingEvent[]) => {
                const all = Array.isArray(events) ? events : [];
                const upcoming = all
                    .filter((ev) => (ev.date || "") >= today)
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || ""))
                    .slice(0, 6);
                setData((prev) => ({
                    ...prev,
                    stats: { ...prev.stats, upcomingEvents: upcoming.length },
                    upcomingEvents: upcoming,
                }));
                setAllEvents(all);
            })
            .catch(() => {
                // Silencioso: si falla, el dashboard mantiene los contadores en 0.
            })
            .finally(() => setLoadingEvents(false));
    }, []);

    const { stats, aiStatus, recentActivities, upcomingEvents } = data;

    return (
        <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-8 relative selection:bg-indigo-500/30">
            {/* Efectos de luces de fondo (Glow) */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">

                {/* Header del Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-300/80 dark:border-slate-800/80 pb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-indigo-500 dark:from-slate-100 dark:via-slate-200 dark:to-indigo-400">
                            VibePlanner Control Panel
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                            Centro de comando inteligente para la gestión de repertorios y eventos musicales.
                        </p>
                    </div>
                    {/* Botón rápido de acción */}
                    <Link
                        href="/songs/create"
                        className="self-start sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95 flex items-center gap-2 border border-indigo-500/30"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Crear con IA
                    </Link>
                </div>

                {/* 2. Sección de Métricas Rápidas (Grid de Tarjetas) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tarjeta 1 */}
                    <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Canciones</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{stats.totalSongs}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Guardadas en tu catálogo</div>
                    </div>
                    {/* Tarjeta 2 */}
                    <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-bold text-[10px] rounded-bl-lg">IA</div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estructuradas por IA</div>
                        <div className="text-3xl font-black text-indigo-500 dark:text-indigo-400 mt-2">{stats.aiGenerated}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">62% del repertorio total</div>
                    </div>
                    {/* Tarjeta 3 */}
                    <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cancioneros / Setlists</div>
                        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-2">{stats.activeSetlists}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Lists compiladas disponibles</div>
                    </div>
                    {/* Tarjeta 4 */}
                    <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Próximos Eventos</div>
                        <div className="text-3xl font-black text-violet-500 dark:text-violet-400 mt-2">{stats.upcomingEvents}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Agendados a partir de hoy</div>
                    </div>
                </div>

                {/* 2.b Próximos Eventos (datos reales) */}
                <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Próximos Eventos</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Los siguientes eventos agendados.</p>
                        </div>
                        <Link href="/events" className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 hover:underline">
                            Ver todos →
                        </Link>
                    </div>

                    {loadingEvents ? (
                        <p className="text-xs text-slate-500 text-center py-6 uppercase tracking-widest font-bold animate-pulse">Cargando agenda...</p>
                    ) : upcomingEvents.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-6 uppercase tracking-widest font-bold bg-slate-200/50 dark:bg-slate-950/40 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                            No hay eventos agendados próximamente.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {upcomingEvents.map((ev) => (
                                <Link
                                    key={ev.id}
                                    href={`/events/${ev.id}`}
                                    className="bg-slate-100/80 dark:bg-slate-950/50 border border-slate-300/60 dark:border-slate-800 px-4 py-3 rounded-xl flex flex-col gap-1 hover:border-indigo-500/60 transition-all"
                                >
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{ev.name}</span>
                                    <span className="text-[10px] font-mono font-bold text-indigo-500 dark:text-indigo-400 uppercase">
                                        {formatEventDate(ev.date)} · {(ev.time || "").slice(0, 5)} hs
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{ev.target_audience}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2.c Analítica de Eventos (gráficas) */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">Analítica de Eventos</h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Visualización de la agenda de eventos.</p>
                    </div>
                    <EventCharts events={allEvents} />
                </div>

                {/* 3. Bloques Informativos Principales (Dos columnas) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Columna Izquierda e Intermedia: Guía Informativa de Módulos (Ocupa 2 de 3 columnas) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="bg-white/50 border border-slate-300/60 dark:bg-slate-900/20 dark:border-slate-800/60 p-6 rounded-2xl backdrop-blur-md">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-4">Módulos del Sistema</h3>
                            <div className="flex flex-col gap-4">

                                {/* Módulo IA */}
                                <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Repertorio Inteligente</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            Organiza canciones, acordes y arreglos con soporte de IA para acelerar la carga y la clasificación automática.
                                        </p>
                                    </div>
                                </div>

                                {/* Módulo Eventos */}
                                <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Coordinación de Eventos</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            Planifica itinerarios, staff, inventario y asistentes. Exporta el evento completo en PDF cuando lo necesites.
                                        </p>
                                    </div>
                                </div>

                                {/* Módulo Cancioneros */}
                                <div className="p-4 bg-slate-100/80 dark:bg-slate-900/50 border border-slate-300/60 dark:border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Compilación de Cancioneros</h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            Agrupa canciones por temática y genera un formato unificado para una lectura fluida en vivo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Estado de la IA y Logs de Actividad (1 columna) */}
                    <div className="flex flex-col gap-6">

                        {/* Estado del Servicio de IA */}
                        <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Cluster Telemetry</h3>
                            <div className="flex flex-col gap-2.5 text-xs font-mono">
                                <div className="flex justify-between border-b border-slate-300/50 dark:border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Proveedor:</span>
                                    <span className="text-slate-800 dark:text-slate-300 font-bold">{aiStatus.provider}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-300/50 dark:border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Modelo LLM:</span>
                                    <span className="text-indigo-500 dark:text-indigo-400 font-bold">{aiStatus.model}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-300/50 dark:border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Latencia Promedio:</span>
                                    <span className="text-slate-800 dark:text-slate-300">{aiStatus.latency}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500">Status:</span>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold rounded-md text-[10px]">
                                        ● {aiStatus.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actividad Reciente */}
                        <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md flex-1 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Bitácora Global</h3>
                            <div className="flex flex-col gap-4 flex-1">
                                {recentActivities.map((act) => (
                                    <div key={act.id} className="flex gap-3 items-start border-b border-slate-300/40 dark:border-slate-800/30 pb-3 last:border-none last:pb-0">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'song' ? 'bg-indigo-500' : act.type === 'event' ? 'bg-violet-500' : 'bg-emerald-500'
                                            }`} />
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-normal">{act.text}</p>
                                            <span className="text-[10px] text-slate-500 font-mono">{act.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}

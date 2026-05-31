// app/dashboard/page.tsx
import Link from "next/link";

// 1. Simulación de datos que vendrían de tu Base de Datos (SQLAlchemy / Flask)
// Al ser un Server Component, en el futuro podrías hacer un fetch directo aquí o usar un ORM si compartieran BD.
const getDashboardData = async () => {
    return {
        stats: {
            totalSongs: 142,
            aiGenerated: 89,
            activeSetlists: 12,
            upcomingEvents: 4,
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
        ]
    };
};

export default async function DashboardPage() {
    const data = await getDashboardData();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 relative selection:bg-indigo-500/30">
            {/* Efectos de luces de fondo (Glow) */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">

                {/* Header del Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-400">
                            VibePlanner Control Panel
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                            Centro de comando inteligente para la gestión de repertorios y eventos musicales.
                        </p>
                    </div>
                    {/* Botón rápido de acción */}
                    <Link
                        href="/songs/create"
                        className="self-start sm:self-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition-all active:scale-95 flex items-center gap-2 border border-indigo-500/30"
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
                    <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Canciones</div>
                        <div className="text-3xl font-black text-slate-100 mt-2">{data.stats.totalSongs}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Guardadas en tu catálogo</div>
                    </div>
                    {/* Tarjeta 2 */}
                    <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden group">
                        <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 font-mono text-[10px] font-bold rounded-bl-xl border-l border-b border-indigo-500/20">AI Engine</div>
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Estructuradas por IA</div>
                        <div className="text-3xl font-black text-indigo-400 mt-2">{data.stats.aiGenerated}</div>
                        <div className="text-[11px] text-slate-400 mt-1">62% del repertorio total</div>
                    </div>
                    {/* Tarjeta 3 */}
                    <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cancioneros / Setlists</div>
                        <div className="text-3xl font-black text-slate-100 mt-2">{data.stats.activeSetlists}</div>
                        <div className="text-[11px] text-emerald-400 mt-1 font-medium">✓ Listos para exportar</div>
                    </div>
                    {/* Tarjeta 4 */}
                    <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Próximos Eventos</div>
                        <div className="text-3xl font-black text-violet-400 mt-2">{data.stats.upcomingEvents}</div>
                        <div className="text-[11px] text-slate-400 mt-1">Coordinados este mes</div>
                    </div>
                </div>

                {/* 3. Bloques Informativos Principales (Dos columnas) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Columna Izquierda e Intermedia: Guía Informativa de Módulos (Ocupa 2 de 3 columnas) */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="bg-slate-900/20 border border-slate-800/60 p-6 rounded-2xl backdrop-blur-md">
                            <h3 className="text-base font-bold text-slate-200 mb-4 tracking-wide">Módulos del Sistema</h3>

                            <div className="flex flex-col gap-4">
                                {/* Módulo IA */}
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">Asistente de Estructuración de Canciones (LangChain)</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            Transforma líricas desordenadas o peticiones de búsqueda en esquemas estructurados de bases de datos utilizando modelos de lenguaje masivos (`LLM`) acoplados con `Pydantic`.
                                        </p>
                                    </div>
                                </div>

                                {/* Módulo Eventos */}
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-violet-500/10 text-violet-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">Coordinación Inteligente de Eventos</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            Asigna marcas de tiempo, géneros predominantes y organiza el orden ideal de los setlists según el tipo de público y la duración estimada del show.
                                        </p>
                                    </div>
                                </div>

                                {/* Módulo Cancioneros */}
                                <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex gap-4 items-start">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">Compilación de Cancioneros Imprimibles / Digitales</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                            Agrupa canciones por artistas o bloques temáticos. Genera un formato unificado en bloques limpios (`intro`, `verso`, `coro`) para una lectura fluida en vivo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna Derecha: Estado de la IA y Logs de Actividad (1 columna) */}
                    <div className="flex flex-col gap-6">

                        {/* Estado del Servicio de IA */}
                        <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Cluster Telemetry</h3>
                            <div className="flex flex-col gap-2.5 text-xs font-mono">
                                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Proveedor:</span>
                                    <span className="text-slate-300 font-bold">{data.aiStatus.provider}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Modelo LLM:</span>
                                    <span className="text-indigo-400 font-bold">{data.aiStatus.model}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-800/50 pb-2">
                                    <span className="text-slate-500">Latencia Promedio:</span>
                                    <span className="text-slate-300">{data.aiStatus.latency}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1">
                                    <span className="text-slate-500">Status:</span>
                                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-md text-[10px]">
                                        ● {data.aiStatus.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actividad Reciente Simetrizada */}
                        <div className="bg-slate-900/40 border border-slate-800/60 p-5 rounded-2xl backdrop-blur-md flex-1 flex flex-col">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Bitácora Global</h3>
                            <div className="flex flex-col gap-4 flex-1">
                                {data.recentActivities.map((act) => (
                                    <div key={act.id} className="flex gap-3 items-start border-b border-slate-800/30 pb-3 last:border-none last:pb-0">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${act.type === 'song' ? 'bg-indigo-500' : act.type === 'event' ? 'bg-violet-500' : 'bg-emerald-500'
                                            }`} />
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-xs text-slate-300 leading-normal">{act.text}</p>
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
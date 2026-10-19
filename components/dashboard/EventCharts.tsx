"use client";

import { useMemo } from "react";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useTheme } from "@/components/theme/ThemeProvider";

export interface EventForCharts {
    id: number;
    name: string;
    date: string;
    time: string;
    target_audience?: string;
    guests_count?: number;
    estimated_logistic_budget?: number;
    staff?: unknown[];
}

const ACCENTS = [
    "#6366f1",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#84cc16",
];

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function monthLabel(key: string): string {
    const [year, month] = key.split("-");
    const idx = parseInt(month, 10) - 1;
    return `${MESES[idx] ?? month} ${year.slice(2)}`;
}

export default function EventCharts({ events }: { events: EventForCharts[] }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const axisColor = isDark ? "#94a3b8" : "#64748b";
    const gridColor = isDark ? "#1e293b" : "#e2e8f0";
    const tooltipStyle = {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
        borderRadius: "0.75rem",
        fontSize: "0.75rem",
        color: isDark ? "#e2e8f0" : "#0f172a",
    };

    const perMonth = useMemo(() => {
        const map = new Map<string, number>();
        for (const ev of events) {
            const key = (ev.date || "").slice(0, 7);
            if (!key) continue;
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return Array.from(map.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-8)
            .map(([key, count]) => ({ mes: monthLabel(key), eventos: count }));
    }, [events]);

    const perAudience = useMemo(() => {
        const map = new Map<string, number>();
        for (const ev of events) {
            const key = (ev.target_audience || "Sin definir").trim() || "Sin definir";
            map.set(key, (map.get(key) ?? 0) + 1);
        }
        return Array.from(map.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));
    }, [events]);

    const perGuests = useMemo(() => {
        return events
            .filter((ev) => (ev.guests_count ?? 0) > 0)
            .slice()
            .sort((a, b) => (b.guests_count ?? 0) - (a.guests_count ?? 0))
            .slice(0, 6)
            .map((ev) => ({
                nombre: ev.name.length > 14 ? `${ev.name.slice(0, 13)}…` : ev.name,
                asistentes: ev.guests_count ?? 0,
            }));
    }, [events]);

    if (events.length === 0) {
        return (
            <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-6 rounded-2xl backdrop-blur-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-2">
                    Analítica de Eventos
                </h3>
                <p className="text-xs text-slate-500 text-center py-8 uppercase tracking-widest font-bold">
                    Aún no hay datos de eventos para graficar.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Eventos por mes */}
            <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-1">
                    Eventos por Mes
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Cantidad de eventos agendados por mes.</p>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={perMonth} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis dataKey="mes" tick={{ fill: axisColor, fontSize: 11 }} stroke={gridColor} />
                            <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} stroke={gridColor} />
                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "#ffffff0d" : "#00000008" }} />
                            <Bar dataKey="eventos" name="Eventos" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribución por público */}
            <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-1">
                    Eventos por Público Objetivo
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Cómo se reparten tus eventos según el público.</p>
                <div className="w-full h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Pie
                                data={perAudience}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                innerRadius={45}
                                paddingAngle={3}
                                label={({ value }) => `${value}`}
                                labelLine={false}
                            >
                                {perAudience.map((entry, i) => (
                                    <Cell key={entry.name} fill={ACCENTS[i % ACCENTS.length]} stroke="none" />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
                    {perAudience.map((entry, i) => (
                        <span key={entry.name} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ACCENTS[i % ACCENTS.length] }} />
                            {entry.name}
                        </span>
                    ))}
                </div>
            </div>

            {/* Asistentes estimados por evento */}
            <div className="bg-white/70 border border-slate-300/60 dark:bg-slate-900/40 dark:border-slate-800/60 p-5 rounded-2xl backdrop-blur-md lg:col-span-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 mb-1">
                    Asistentes Estimados por Evento
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Los eventos con mayor público convocado.</p>
                {perGuests.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-8 uppercase tracking-widest font-bold">
                        Ningún evento tiene asistentes estimados cargados.
                    </p>
                ) : (
                    <div className="w-full h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={perGuests} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                                <XAxis dataKey="nombre" tick={{ fill: axisColor, fontSize: 11 }} stroke={gridColor} />
                                <YAxis allowDecimals={false} tick={{ fill: axisColor, fontSize: 11 }} stroke={gridColor} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? "#ffffff0d" : "#00000008" }} />
                                <Bar dataKey="asistentes" name="Asistentes" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={64} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

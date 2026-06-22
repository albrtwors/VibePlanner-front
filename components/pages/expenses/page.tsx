"use client";
import { useState, useEffect } from "react";
import { endpoint } from "@/consts/backEndpoint";

export default function ExpensesCalculatorPage() {
    const [eventsData, setEventsData] = useState<any[]>([]);
    const [catalog, setCatalog] = useState<any[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsMounted(true);
        Promise.all([
            fetch(`${endpoint}api/events`).then(res => res.json()),
            fetch(`${endpoint}api/inventory`).then(res => res.json())
        ])
            .then(([events, inventoryCatalog]) => {
                setEventsData(events);
                setCatalog(inventoryCatalog);
                setLoading(false);
            })
            .catch(err => console.error("Error cargando data:", err));
    }, []);

    const getPrice = (itemId: number) => {
        const found = catalog.find(c => c.id === itemId);
        return found ? Number(found.price_per_unit) : 0;
    };

    if (!isMounted) return null;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 font-medium text-slate-100 flex flex-col gap-8">
            <div className="border-b border-slate-800 pb-5">
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-100 sm:text-3xl">Control de Gastos por Evento</h1>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500 animate-pulse">Sincronizando estados financieros...</div>
            ) : (
                <div className="flex flex-col gap-6">
                    {eventsData.map((evt) => {
                        const totalEvento = evt.inventory?.reduce((sum: number, item: any) => {
                            const price = getPrice(item.item_id);
                            const qty = Number(item.quantity_used || 0);
                            return sum + (qty * price);
                        }, 0) || 0;

                        return (
                            <div key={evt.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                                {/* Cabecera con Nombre y Fecha */}
                                <div className="bg-slate-950/50 p-4 border-b border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h2 className="font-black text-sm text-indigo-400 uppercase tracking-widest">{evt.name}</h2>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Fecha: {evt.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-slate-400 block uppercase">Total Evento</span>
                                        <span className="text-xl font-mono font-black text-emerald-400">
                                            ${totalEvento.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <table className="w-full text-left text-xs">
                                    <thead className="text-[10px] uppercase text-slate-500 bg-slate-950/30">
                                        <tr>
                                            <th className="p-4">Artículo</th>
                                            <th className="p-4 text-right">Cantidad</th>
                                            <th className="p-4 text-right">Precio Unit.</th>

                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {evt.inventory?.map((item: any, idx: number) => {
                                            const price = getPrice(item.item_id);
                                            const qty = Number(item.quantity_used || 0);
                                            const subtotal = qty * price;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-950/20">
                                                    <td className="p-4 text-slate-300 font-bold text-center">{item.name}</td>
                                                    <td className="p-4 font-mono text-slate-100 text-center">{qty} {item.unit}</td>
                                                    <td className="p-4 font-mono text-slate-400 text-center">${price.toFixed(2)}</td>

                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
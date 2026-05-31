"use client";
import { useState } from "react";
import Link from "next/link";
import GenericButton from "@/components/buttons/GenericButton";
import SongCard from "@/components/cards/SongCard";
import { notify } from "@/utils/toast";

export default function SongsIndex() {
    const [search, setSearch] = useState("");

    // Funciones placeholder para los botones de la card
    const handleEditPlaceholder = (title: string) => {
        notify.success(`Abriendo editor para: ${title}`);
    };

    const handleDeletePlaceholder = (title: string) => {
        notify.success(`Eliminando (simulado): ${title}`);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

            {/* Header de la página */}
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
                    Gestión de Canciones
                </h1>
                <p className="text-base text-slate-400 max-w-2xl">
                    Aquí podrás crear, editar y organizar el repertorio musical para tus próximos eventos.
                </p>
            </div>

            {/* Barra de Controles: Buscador + Botón Crear */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">

                {/* Buscador */}
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                        {/* Icono de Lupa simple en SVG */}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por título, artista o tono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    />
                </div>

                {/* Botón de navegación para Crear */}
                <Link href="/songs/create" >
                    <GenericButton color="primary">

                        Nueva Canción
                    </GenericButton>
                </Link>
            </div>

            {/* Contenedor de Registros (Placeholders actuales) */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                    <span>Lista de canciones (Vista Previa)</span>
                    <span>Acciones</span>
                </div>

                {/* Mapeo simulado de cards */}
                <SongCard
                    title="Placeholder Song (Ejemplo)"
                    artist="Artista de Prueba"
                    keySignature="G#m"
                    bpm={120}
                    onEdit={() => handleEditPlaceholder("Placeholder Song (Ejemplo)")}
                    onDelete={() => handleDeletePlaceholder("Placeholder Song (Ejemplo)")}
                />

                <SongCard
                    title="Segunda Canción Demo"
                    artist="Compositor Desconocido"
                    keySignature="C"
                    bpm={85}
                    onEdit={() => handleEditPlaceholder("Segunda Canción Demo")}
                    onDelete={() => handleDeletePlaceholder("Segunda Canción Demo")}
                />
            </div>

        </div>
    );
}
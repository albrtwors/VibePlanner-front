// app/files/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import GenericButton from "@/components/buttons/GenericButton";
import FileCard from "@/components/cards/FileCard";
import { notify } from "@/utils/toast";
import { endpoint } from "@/consts/backEndpoint";

interface FileRepertoire {
    id: number;
    name: string;
    tematica: string | null;
    songs_count: number;
    created_at: string;
}

export default function FilesIndex() {
    const [search, setSearch] = useState("");
    const [files, setFiles] = useState<FileRepertoire[]>([]);
    const [loading, setLoading] = useState(true);

    // Carga los repertorios aplicando filtros dinámicos
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (search.trim() !== "") {
                queryParams.append("name", search);
                queryParams.append("tematica", search);
            }

            const res = await fetch(`${endpoint}api/files/?${queryParams.toString()}`);
            if (!res.ok) throw new Error("Error en la petición de cancioneros");

            const data = await res.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error(error);
            notify.error("No se pudieron cargar los cancioneros.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchFiles();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [search]);

    // Eliminar el repertorio físico
    const handleDelete = async (id: number, name: string) => {
        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar el cancionero "${name}"?`);
        if (!confirmed) return;

        try {
            const res = await fetch(`${endpoint}api/files/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("No se pudo eliminar el cancionero del servidor.");

            setFiles((prevFiles) => prevFiles.filter((f) => f.id !== id));
            notify.success(`Cancionero "${name}" eliminado con éxito.`);
        } catch (error: any) {
            console.error(error);
            notify.error(error.message || "Ocurrió un error al intentar eliminar el cancionero.");
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-8">

            {/* Cabecera */}
            <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight sm:text-4xl">
                    Gestión de Cancioneros
                </h1>
                <p className="text-base text-slate-400 max-w-2xl">
                    Crea, estructura y define el orden de tus canciones agrupadas por eventos o temáticas específicas.
                </p>
            </div>

            {/* Barra de Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800/80">
                <div className="relative flex-1 max-w-md">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar cancionero por nombre o temática..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/60 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                    />
                </div>

                <Link href="/files/create">
                    <GenericButton color="primary">
                        Nuevo Cancionero
                    </GenericButton>
                </Link>
            </div>

            {/* Listado Reactivo */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                    <span>Lista de Cancioneros ({files.length})</span>
                    <span>Acciones</span>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-sm text-slate-500 animate-pulse">
                        Cargando cancioneros...
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-12 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl text-sm text-slate-500">
                        No se encontraron cancioneros creados. ¡Arma el primero!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {files.map((file) => (
                            <FileCard
                                key={file.id}
                                id={file.id}
                                name={file.name}
                                tematica={file.tematica}
                                songsCount={file.songs_count}
                                createdAt={file.created_at}
                                onDelete={() => handleDelete(file.id, file.name)}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
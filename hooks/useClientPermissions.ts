// hooks/useClientPermissions.ts
"use client";

import { useEffect, useState } from "react";
import { getClientProfile } from "@/utils/proxy";
import { hasPermission, ClientProfile } from "@/utils/permissions";

/**
 * Permisos del usuario logueado para decide qué mostrar en la interfaz.
 *
 * OJO: esto solo oculta botones. El backend sigue siendo el que manda: cada
 * ruta protegida responde 403 igual, haya o no botón en pantalla.
 */
export function useClientPermissions() {
    const [profile, setProfile] = useState<ClientProfile | null>(null);

    useEffect(() => {
        let cancelled = false;
        getClientProfile().then((data) => {
            if (!cancelled) setProfile(data);
        });
        return () => { cancelled = true; };
    }, []);

    const can = (...keys: string[]) => hasPermission(profile?.permissions, ...keys);

    return {
        profile,
        permissions: profile?.permissions ?? [],
        can,
        // Mientras no cargue el perfil preferimos no mostrar acciones.
        ready: profile !== null,
    };
}
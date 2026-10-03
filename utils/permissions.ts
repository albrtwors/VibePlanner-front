export type ClientProfile = {
    user_id: number;
    username: string;
    role: string;
    permissions: string[];
};

export const ROLE_LABELS: Record<string, string> = {
    admin: "Administrador",
    musico: "Músico",
    cantante: "Cantante",
    apoyo_logistico: "Apoyo Logístico",
    usuario: "Usuario",
};

export const ROLE_LABELS_FALLBACK = "Rol personalizado";

export function roleLabel(role: string): string {
    if (!role) return ROLE_LABELS_FALLBACK;
    return ROLE_LABELS[role.toLowerCase()] || ROLE_LABELS_FALLBACK;
}

/**
 * El backend es el que manda: esto solo oculta cosas de la interfaz.
 * Si un permiso no está en la lista, el botón no se muestra.
 */
export function hasPermission(permissions: string[] | null | undefined, ...required: string[]): boolean {
    if (!permissions || permissions.length === 0) return false;
    if (permissions.includes("*")) return true;
    return required.some(permission => permissions.includes(permission));
}

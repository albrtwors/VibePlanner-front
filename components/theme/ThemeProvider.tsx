"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "dark",
    toggleTheme: () => {},
    setTheme: () => {},
});

export const THEME_STORAGE_KEY = "vibeplanner-theme";

/** Lee el tema guardado o usa "dark" por defecto (coherente con la estética actual). */
export function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    try {
        const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") return stored;
    } catch {
        // localStorage puede fallar en modo privado; ignoramos.
    }
    return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("dark");

    // Al montar, sincroniza con lo que ya haya en <html> (inyectado por el script inline del layout)
    // y escucha cambios de otras pestañas.
    useEffect(() => {
        const apply = (t: Theme) => {
            document.documentElement.classList.toggle("dark", t === "dark");
            setThemeState(t);
        };
        apply(getInitialTheme());

        const onStorage = (e: StorageEvent) => {
            if (e.key === THEME_STORAGE_KEY && (e.newValue === "light" || e.newValue === "dark")) {
                apply(e.newValue);
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const setTheme = useCallback((t: Theme) => {
        setThemeState(t);
        document.documentElement.classList.toggle("dark", t === "dark");
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, t);
        } catch {
            // ignorar
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark");
    }, [setTheme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

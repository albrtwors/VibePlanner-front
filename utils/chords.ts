// utils/chords.ts
//
// Validación de acordes en el cliente. Es un espejo reducido del parser del
// backend (services/transpose_service.py): acá NO se transpone, solo se decide
// si un token es un acorde o no.
//
// Sirve para desambiguar en el editor: un [CORO] al inicio de línea es una
// sección, pero un [Am] suelto es una fila de acordes. Sin esta comprobación,
// escribir acordes inline rompería la estructura en secciones falsas.

const ROOT_RE = /^([A-Ga-g])([#b]?)(.*)$/;

// Lo que puede ir detrás de la tónica para que sea un acorde de verdad.
// Cualquier palabra que empiece con A-G pero no sea acorde (Coro, Amor, Fade)
// queda descartada porque su cola no matchea.
const CHORD_TAIL_RE =
    /^(?:maj|min|m|M|dim|aug|sus|add|alt|no|omit)?\d{0,2}(?:[#b+-]\d{1,2}|(?:add|sus)\d{1,2})?$/;

export function isChordToken(token: string): boolean {
    const clean = token.trim();
    if (!clean) return false;

    let body = clean;

    // Acorde con bajo (C/E, Am7/G): validamos las dos mitades.
    if (clean.includes("/")) {
        const parts = clean.split("/");
        if (parts.length !== 2) return false;
        body = parts[0];

        const slashMatch = parts[1].match(ROOT_RE);
        if (!slashMatch) return false;
        const slashTail = slashMatch[3];
        if (slashTail && !CHORD_TAIL_RE.test(slashTail)) return false;
    }

    const match = body.match(ROOT_RE);
    if (!match) return false;

    const tail = match[3];
    if (tail && !CHORD_TAIL_RE.test(tail)) return false;

    return true;
}

// Mismo catálogo que expone GET /api/songs/keys (12 mayores + 12 menores).
export const SONG_KEYS: readonly string[] = [
    "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
    "Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "Abm", "Am", "Bbm", "Bm",
];

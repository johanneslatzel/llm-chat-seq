/** Read an env var and return its trimmed value, or `fallback` when unset or whitespace-only. */
function envString(key: string, fallback: string): string {
    const raw = process.env[key];
    if (raw === undefined || raw.trim() === '') return fallback;
    return raw.trim();
}

/** Parse an env var as an integer clamped to at least `min`, or `fallback` when unset or invalid. */
function envInt(key: string, fallback: number, min = 1): number {
    const raw = process.env[key];
    if (raw === undefined || raw === '') return Math.max(min, fallback);
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? Math.max(min, fallback) : Math.max(min, parsed);
}

export { envInt, envString };

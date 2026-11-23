import { createEnvReader, NumberParsing, RangePolicy } from '@johannes.latzel/env';

function makeEnv() {
    return createEnvReader({
        numberParsing: NumberParsing.Lenient,
        rangePolicy: RangePolicy.Clamp
    });
}

/** Read an env var and return its trimmed value, or `fallback` when unset or whitespace-only. */
export function envString(key: string, fallback: string): string {
    const value = makeEnv().string(key, fallback).trim();
    return value === '' ? fallback : value;
}

/** Parse an env var as an integer clamped to at least `min`, or `fallback` when unset or invalid. */
export function envInt(key: string, fallback: number, min = 1): number {
    return makeEnv().int(key, Math.max(min, fallback), min);
}

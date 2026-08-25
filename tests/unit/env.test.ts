import { describe, it, expect, beforeEach } from 'vitest';
import { envString, envInt } from '../../src/lib/env.js';

const STRING_KEY = 'LLM_CHAT_SEQ_TEST_STRING';
const INT_KEY = 'LLM_CHAT_SEQ_TEST_INT';

beforeEach(() => {
    delete process.env[STRING_KEY];
    delete process.env[INT_KEY];
});

describe('envString', () => {
    it('returns the trimmed value when set', () => {
        process.env[STRING_KEY] = '  http://seq.test  ';
        expect(envString(STRING_KEY, 'fallback')).toBe('http://seq.test');
    });

    it('returns the fallback when unset', () => {
        expect(envString(STRING_KEY, 'fallback')).toBe('fallback');
    });

    it('returns the fallback when empty or whitespace', () => {
        process.env[STRING_KEY] = '   ';
        expect(envString(STRING_KEY, 'fallback')).toBe('fallback');
    });
});

describe('envInt', () => {
    it('parses the value', () => {
        process.env[INT_KEY] = '42';
        expect(envInt(INT_KEY, 10)).toBe(42);
    });

    it('returns the fallback when unset or empty', () => {
        expect(envInt(INT_KEY, 10)).toBe(10);
        process.env[INT_KEY] = '';
        expect(envInt(INT_KEY, 10)).toBe(10);
    });

    it('returns the fallback when the value is not a number', () => {
        process.env[INT_KEY] = 'abc';
        expect(envInt(INT_KEY, 10)).toBe(10);
    });

    it('clamps the parsed value to the minimum', () => {
        process.env[INT_KEY] = '0';
        expect(envInt(INT_KEY, 10)).toBe(1);
    });

    it('clamps the fallback to the minimum', () => {
        expect(envInt(INT_KEY, 0)).toBe(1);
    });
});

import { describe, it, expect } from 'vitest';
import type { SeqEvent, SignalEntity } from '@johannes.latzel/seq-client';
import {
    formatEvents,
    formatQueryResult,
    formatSignals,
    parseIsoDate
} from '../../src/lib/format.js';

describe('formatEvents', () => {
    it('formats events with header, message, and flattened properties', () => {
        const events: SeqEvent[] = [
            {
                Timestamp: '2026-01-01T00:00:00Z',
                Level: 'Error',
                EventType: 'Exception',
                RenderedMessage: 'boom',
                Id: 'evt-1',
                TraceId: 'trace-1',
                Properties: [
                    { Name: 'user', Value: 'alice' },
                    { Name: 'count', Value: 3 }
                ]
            }
        ];
        const out = formatEvents(events);
        expect(out).toContain('2026-01-01T00:00:00Z Error Exception');
        expect(out).toContain('boom');
        expect(out).toContain('id=evt-1');
        expect(out).toContain('trace=trace-1');
        expect(out).toContain('properties={"user":"alice","count":3}');
    });

    it('includes exception and span when present', () => {
        const events: SeqEvent[] = [
            { Timestamp: '2026-01-01T00:00:00Z', Exception: 'System.Exception', SpanId: 'span-1' }
        ];
        const out = formatEvents(events);
        expect(out).toContain('exception=System.Exception');
        expect(out).toContain('span=span-1');
    });

    it('returns a message when no events match', () => {
        expect(formatEvents([])).toBe('No events matched the filter.');
    });
});

describe('formatQueryResult', () => {
    it('returns the csv unchanged when small', () => {
        expect(formatQueryResult('a,b\n1,2')).toBe('a,b\n1,2');
    });

    it('returns a note when the csv is empty', () => {
        expect(formatQueryResult('   ')).toBe('The query returned no rows.');
    });

    it('truncates very large csv results', () => {
        const big = 'x'.repeat(25_000);
        const out = formatQueryResult(big);
        expect(out.startsWith('x'.repeat(20_000))).toBe(true);
        expect(out).toContain('[truncated 5000 characters]');
    });
});

describe('formatSignals', () => {
    it('formats title, id, description, and filter expressions', () => {
        const signals: SignalEntity[] = [
            {
                Title: 'Errors',
                Id: 'sig-1',
                Description: 'All errors',
                Filters: [{ Filter: "@Level = 'Error'" }, { FilterNonStrict: "@Level = 'Fatal'" }]
            }
        ];
        const out = formatSignals(signals);
        expect(out).toContain('Errors');
        expect(out).toContain('id=sig-1');
        expect(out).toContain('description=All errors');
        expect(out).toContain("filters: @Level = 'Error' OR @Level = 'Fatal'");
    });

    it('omits missing fields and empty descriptions', () => {
        const signals: SignalEntity[] = [
            { Title: 'Minimal', Description: '', Filters: [{ Description: 'n/a' }] }
        ];
        const out = formatSignals(signals);
        expect(out).toBe('Minimal');
    });

    it('handles a signal with no description or filters', () => {
        const signals: SignalEntity[] = [{ Title: 'NoMeta' }];
        const out = formatSignals(signals);
        expect(out).toBe('NoMeta');
    });

    it('returns a message when no signals exist', () => {
        expect(formatSignals([])).toBe('No signals found.');
    });
});

describe('parseIsoDate', () => {
    it('returns undefined when the value is undefined', () => {
        const errors: string[] = [];
        expect(parseIsoDate(undefined, 'from_date', errors)).toBeUndefined();
        expect(errors).toHaveLength(0);
    });

    it('pushes an error for non-string values', () => {
        const errors: string[] = [];
        expect(parseIsoDate(42, 'from_date', errors)).toBeUndefined();
        expect(errors).toEqual(['from_date must be an ISO 8601 date string']);
    });

    it('pushes an error for invalid dates', () => {
        const errors: string[] = [];
        expect(parseIsoDate('not-a-date', 'to_date', errors)).toBeUndefined();
        expect(errors).toEqual(['to_date must be a valid ISO 8601 date string']);
    });

    it('parses valid ISO dates', () => {
        const errors: string[] = [];
        const date = parseIsoDate('2026-01-01T00:00:00Z', 'from_date', errors);
        expect(date?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
        expect(errors).toHaveLength(0);
    });
});

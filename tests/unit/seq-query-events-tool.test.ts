import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeqClient } from '@johannes.latzel/seq-client';
import { SeqQueryEventsTool } from '../../src/tools/seq-query-events-tool.js';

function makeClient(): SeqClient {
    return new SeqClient({ url: 'http://seq.test' });
}

function stubFetchJson(data: unknown, status = 200): void {
    vi.stubGlobal(
        'fetch',
        async (): Promise<Response> =>
            new Response(JSON.stringify(data), {
                status,
                headers: { 'Content-Type': 'application/json' }
            })
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SeqQueryEventsTool', () => {
    it('exposes the tool name and a Seq-focused description', () => {
        const tool = new SeqQueryEventsTool(makeClient());
        expect(tool.name).toBe('seq_query_events');
        expect(tool.description).toContain('Seq');
    });

    it('returns formatted events on success with all options', async () => {
        stubFetchJson([
            {
                Timestamp: '2026-01-01T00:00:00Z',
                Level: 'Error',
                RenderedMessage: 'boom',
                Properties: [{ Name: 'user', Value: 'alice' }]
            }
        ]);
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({
            filter: "@Level = 'Error'",
            signal: 'sig-1',
            count: 5,
            render: true,
            from_date: '2026-01-01T00:00:00Z',
            to_date: '2026-01-02T00:00:00Z'
        });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toContain('boom');
        expect(results[0]?.result).toContain('properties={"user":"alice"}');
    });

    it('returns a readable message when no events match', async () => {
        stubFetchJson([]);
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toBe('No events matched the filter.');
    });

    it('returns an error result for invalid argument types', async () => {
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({
            filter: 42,
            signal: 7,
            count: 'x',
            render: 'yes',
            from_date: 'nope',
            to_date: 42
        });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('filter');
        expect(results[0]?.result).toContain('signal');
        expect(results[0]?.result).toContain('count');
        expect(results[0]?.result).toContain('render');
        expect(results[0]?.result).toContain('from_date');
        expect(results[0]?.result).toContain('to_date');
    });

    it('rejects a non-integer count', async () => {
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({ count: 2.5 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('count');
    });

    it('rejects a zero count', async () => {
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({ count: 0 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('count');
    });

    it('maps a SeqApiError to an error result', async () => {
        stubFetchJson({ Error: 'bad filter' }, 400);
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({ filter: '@Level =' });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('Seq query failed');
        expect(results[0]?.result).toContain('bad filter');
    });

    it('maps unexpected errors to an error result', async () => {
        vi.stubGlobal('fetch', async (): Promise<Response> => {
            throw new Error('network down');
        });
        const tool = new SeqQueryEventsTool(makeClient());
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('network down');
    });
});

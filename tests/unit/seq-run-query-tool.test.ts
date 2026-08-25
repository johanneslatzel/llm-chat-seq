import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeqClient } from '@johannes.latzel/seq-client';
import { SeqRunQueryTool } from '../../src/tools/seq-run-query-tool.js';

function makeClient(): SeqClient {
    return new SeqClient({ url: 'http://seq.test' });
}

function stubFetchText(body: string, status = 200): void {
    vi.stubGlobal('fetch', async (): Promise<Response> => new Response(body, { status }));
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SeqRunQueryTool', () => {
    it('exposes the tool name and description', () => {
        const tool = new SeqRunQueryTool(makeClient());
        expect(tool.name).toBe('seq_run_query');
        expect(tool.description).toContain('CSV');
    });

    it('returns the query result as CSV on success with all options', async () => {
        stubFetchText('a,b\n1,2');
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({
            q: 'select a, b from stream',
            range_start: '2026-01-01T00:00:00Z',
            range_end: '2026-01-02T00:00:00Z',
            signal: 'sig-1',
            timeout_ms: 5000
        });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toBe('a,b\n1,2');
    });

    it('returns a note when the query returns no rows', async () => {
        stubFetchText('   ');
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 'select 1' });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toBe('The query returned no rows.');
    });

    it('returns an error result for a non-string query', async () => {
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 42 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('q must be a non-empty string');
    });

    it('returns an error result for a whitespace query', async () => {
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: '   ' });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('q must be a non-empty string');
    });

    it('returns an error result for invalid option types', async () => {
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({
            q: 'select 1',
            signal: 7,
            timeout_ms: 'x',
            range_start: 'nope',
            range_end: 42
        });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('signal');
        expect(results[0]?.result).toContain('timeout_ms');
        expect(results[0]?.result).toContain('range_start');
        expect(results[0]?.result).toContain('range_end');
    });

    it('rejects a non-integer timeout', async () => {
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 'select 1', timeout_ms: 2.5 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('timeout_ms');
    });

    it('rejects a zero timeout', async () => {
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 'select 1', timeout_ms: 0 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('timeout_ms');
    });

    it('maps a SeqApiError to an error result', async () => {
        vi.stubGlobal(
            'fetch',
            async (): Promise<Response> =>
                new Response(JSON.stringify({ Error: 'syntax error' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                })
        );
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 'select from' });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('Seq query failed');
        expect(results[0]?.result).toContain('syntax error');
    });

    it('maps unexpected errors to an error result', async () => {
        vi.stubGlobal('fetch', async (): Promise<Response> => {
            throw new Error('connection refused');
        });
        const tool = new SeqRunQueryTool(makeClient());
        const results = await tool.execute({ q: 'select 1' });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('connection refused');
    });
});

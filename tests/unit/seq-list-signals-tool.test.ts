import { afterEach, describe, expect, it, vi } from 'vitest';
import { SeqClient } from '@johannes.latzel/seq-client';
import { SeqListSignalsTool } from '../../src/tools/seq-list-signals-tool.js';

interface Call {
    url: string;
    init: RequestInit;
}

function makeClient(): SeqClient {
    return new SeqClient({ url: 'http://seq.test' });
}

function stubFetchJson(data: unknown, calls: Call[] = [], status = 200): void {
    vi.stubGlobal(
        'fetch',
        async (
            input: Parameters<typeof fetch>[0],
            init?: Parameters<typeof fetch>[1]
        ): Promise<Response> => {
            calls.push({ url: String(input), init: init ?? {} });
            return new Response(JSON.stringify(data), {
                status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
    );
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SeqListSignalsTool', () => {
    it('exposes the tool name and description', () => {
        const tool = new SeqListSignalsTool(makeClient());
        expect(tool.name).toBe('seq_list_signals');
        expect(tool.description).toContain('filter expressions');
    });

    it('returns formatted signals on success with options', async () => {
        const calls: Call[] = [];
        stubFetchJson(
            [
                {
                    Title: 'Errors',
                    Id: 'sig-1',
                    Description: 'All errors',
                    Filters: [{ Filter: "@Level = 'Error'" }]
                }
            ],
            calls
        );
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({ shared: true, owner_id: 'user-1' });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toContain('Errors');
        expect(results[0]?.result).toContain('id=sig-1');
        expect(results[0]?.result).toContain("filters: @Level = 'Error'");
        expect(calls[0]?.url).toContain('shared=true');
        expect(calls[0]?.url).toContain('ownerId=user-1');
    });

    it('defaults to shared=true when neither shared nor owner_id is given', async () => {
        const calls: Call[] = [];
        stubFetchJson([], calls);
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toBe('No signals found.');
        expect(calls[0]?.url).toContain('shared=true');
    });

    it('sends only ownerId when owner_id is given without shared', async () => {
        const calls: Call[] = [];
        stubFetchJson([{ Title: 'Mine' }], calls);
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({ owner_id: 'user-1' });
        expect(results[0]?.status).toBe('success');
        expect(calls[0]?.url).toContain('ownerId=user-1');
        expect(calls[0]?.url).not.toContain('shared');
    });

    it('returns an error result for an invalid shared value', async () => {
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({ shared: 'yes' });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('shared');
    });

    it('returns an error result for an invalid owner_id value', async () => {
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({ owner_id: 42 });
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('owner_id');
    });

    it('maps a SeqApiError to an error result', async () => {
        stubFetchJson({ Error: 'unauthorized' }, [], 401);
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('Seq query failed');
        expect(results[0]?.result).toContain('unauthorized');
    });

    it('maps unexpected errors to an error result', async () => {
        vi.stubGlobal('fetch', async (): Promise<Response> => {
            throw new Error('unreachable');
        });
        const tool = new SeqListSignalsTool(makeClient());
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('error');
        expect(results[0]?.result).toContain('unreachable');
    });
});

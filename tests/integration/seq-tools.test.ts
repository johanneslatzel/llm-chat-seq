import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSeqClient, SeqConfiguration, SeqToolsPackage } from '../../src/index.js';
import { startMockSeq, type MockSeqServer } from '../helper/mock-seq.js';

const externalUrl = process.env.SEQ_TEST_URL;
let mock: MockSeqServer | undefined;
let url: string;
let pkg: SeqToolsPackage;

beforeAll(async () => {
    if (externalUrl === undefined) {
        mock = await startMockSeq();
        url = mock.url;
    } else {
        url = externalUrl;
    }
    pkg = new SeqToolsPackage(createSeqClient(new SeqConfiguration(url)));
});

afterAll(async () => {
    await mock?.close();
});

describe('llm-chat-seq integration', () => {
    it('lists signals and their filter expressions', async () => {
        const tool = pkg.tools().find((t) => t.name === 'seq_list_signals')!;
        const results = await tool.execute({});
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toContain('Errors');
        expect(results[0]?.result).toContain('id=sig-errors');
        expect(results[0]?.result).toContain("filters: @Level = 'Error'");
    });

    it('queries events with a filter', async () => {
        const tool = pkg.tools().find((t) => t.name === 'seq_query_events')!;
        const results = await tool.execute({ filter: "@Level = 'Error'", count: 5, render: true });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toContain('boom');
        expect(results[0]?.result).toContain('properties={"user":"alice"}');
    });

    it('runs a SQL query as CSV', async () => {
        const tool = pkg.tools().find((t) => t.name === 'seq_run_query')!;
        const results = await tool.execute({ q: 'select count(*) from stream' });
        expect(results[0]?.status).toBe('success');
        expect(results[0]?.result).toBe('q,count\nselect count(*) from stream,2\n');
    });
});

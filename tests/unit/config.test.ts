import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SeqClient } from '@johannes.latzel/seq-client';
import { SeqConfiguration, createSeqClient, SEQ_TIMEOUT_DEFAULT_MS } from '../../src/lib/config.js';

const URL_KEY = 'LLM_CHAT_SEQ_URL';
const API_KEY = 'LLM_CHAT_SEQ_API_KEY';
const TIMEOUT_KEY = 'LLM_CHAT_SEQ_TIMEOUT_MS';

beforeEach(() => {
    delete process.env[URL_KEY];
    delete process.env[API_KEY];
    delete process.env[TIMEOUT_KEY];
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('SeqConfiguration', () => {
    it('reads defaults from environment variables', () => {
        process.env[URL_KEY] = 'http://env.test';
        process.env[API_KEY] = 'env-key';
        process.env[TIMEOUT_KEY] = '7000';
        const config = new SeqConfiguration();
        expect(config.url).toBe('http://env.test');
        expect(config.apiKey).toBe('env-key');
        expect(config.timeoutMs).toBe(7000);
    });

    it('defaults to an empty url and apiKey with the default timeout when env is unset', () => {
        const config = new SeqConfiguration();
        expect(config.url).toBe('');
        expect(config.apiKey).toBe('');
        expect(config.timeoutMs).toBe(SEQ_TIMEOUT_DEFAULT_MS);
    });

    it('treats a whitespace url env as unset', () => {
        process.env[URL_KEY] = '   ';
        const config = new SeqConfiguration();
        expect(config.url).toBe('');
    });

    it('constructor overrides win over env values', () => {
        process.env[URL_KEY] = 'http://env.test';
        process.env[API_KEY] = 'env-key';
        process.env[TIMEOUT_KEY] = '7000';
        const config = new SeqConfiguration('http://ctor.test', 'ctor-key', 5000);
        expect(config.url).toBe('http://ctor.test');
        expect(config.apiKey).toBe('ctor-key');
        expect(config.timeoutMs).toBe(5000);
    });

    it('keeps an explicitly empty apiKey override', () => {
        const config = new SeqConfiguration('http://seq.test', '');
        expect(config.apiKey).toBe('');
    });
});

describe('createSeqClient', () => {
    it('builds a SeqClient using the config values', async () => {
        const calls: string[] = [];
        vi.stubGlobal('fetch', async (input: Parameters<typeof fetch>[0]): Promise<Response> => {
            calls.push(String(input));
            return new Response(
                JSON.stringify({ Product: 'Seq', Version: '1', InstanceName: null, Links: {} }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        });
        const client = createSeqClient(new SeqConfiguration('http://seq.test', 'key', 5000));
        expect(client).toBeInstanceOf(SeqClient);
        const root = await client.root();
        expect(root.Product).toBe('Seq');
        expect(calls[0]).toBe('http://seq.test/api');
        expect(calls).toHaveLength(1);
    });

    it('omits the api key header for an empty api key', async () => {
        const calls: { url: string; init: RequestInit }[] = [];
        vi.stubGlobal(
            'fetch',
            async (
                input: Parameters<typeof fetch>[0],
                init?: Parameters<typeof fetch>[1]
            ): Promise<Response> => {
                calls.push({ url: String(input), init: init ?? {} });
                return new Response(JSON.stringify({}), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        );
        const client = createSeqClient(new SeqConfiguration('http://seq.test'));
        await client.root();
        const headers = calls[0]?.init.headers as Record<string, string>;
        expect(headers?.['X-Seq-ApiKey']).toBeUndefined();
    });

    it('throws when no url is configured', () => {
        expect(() => createSeqClient(new SeqConfiguration())).toThrow(/url/);
    });
});

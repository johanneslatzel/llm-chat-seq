import { envInt, envString } from './env.js';
import { SeqClient, type SeqClientOptions } from '@johannes.latzel/seq-client';

/** Default per-request timeout in milliseconds, used when `LLM_CHAT_SEQ_TIMEOUT_MS` is unset. */
export const SEQ_TIMEOUT_DEFAULT_MS = 10_000;

/** Client configuration for a Seq server, resolved from `LLM_CHAT_SEQ_*` environment variables. */
export class SeqConfiguration {
    /** Base URL of the Seq server. */
    url: string = envString('LLM_CHAT_SEQ_URL', '');
    /** API key sent as the `X-Seq-ApiKey` header. An empty string means unauthenticated. */
    apiKey: string = envString('LLM_CHAT_SEQ_API_KEY', '');
    /** Per-request timeout in milliseconds. */
    timeoutMs: number = envInt('LLM_CHAT_SEQ_TIMEOUT_MS', SEQ_TIMEOUT_DEFAULT_MS);

    /**
     * @param url       - Base URL of the Seq server (defaults to `LLM_CHAT_SEQ_URL`).
     * @param apiKey    - API key sent as the `X-Seq-ApiKey` header (defaults to `LLM_CHAT_SEQ_API_KEY`).
     * @param timeoutMs - Per-request timeout in milliseconds (defaults to `LLM_CHAT_SEQ_TIMEOUT_MS`).
     */
    constructor(url?: string, apiKey?: string, timeoutMs?: number) {
        if (url !== undefined) this.url = url;
        if (apiKey !== undefined) this.apiKey = apiKey;
        if (timeoutMs !== undefined) this.timeoutMs = timeoutMs;
    }
}

/**
 * Build a `SeqClient` from a {@link SeqConfiguration}.
 *
 * @param config - The configuration to use.
 * @returns A configured `SeqClient`.
 * @throws If `config.url` is empty or whitespace.
 */
export function createSeqClient(config: SeqConfiguration): SeqClient {
    if (config.url.trim() === '') {
        throw new Error(
            'SeqConfiguration requires a url (set LLM_CHAT_SEQ_URL or pass url to SeqConfiguration)'
        );
    }
    const options: SeqClientOptions = { url: config.url, timeoutMs: config.timeoutMs };
    if (config.apiKey !== '') {
        options.apiKey = config.apiKey;
    }
    return new SeqClient(options);
}

import {
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import type { PartialToolResult } from '@johannes.latzel/llm-chat';
import { SeqClient, type DataQueryOptions } from '@johannes.latzel/seq-client';
import { formatQueryResult, parseIsoDate } from '../lib/format.js';

/** Tool that runs a SQL query against Seq and returns the result rows as CSV. */
export class SeqRunQueryTool extends Tool {
    /**
     * @param client - A configured `SeqClient`.
     */
    constructor(private readonly client: SeqClient) {
        super(
            'seq_run_query',
            'Runs a SQL query against Seq and returns the result rows as CSV.',
            new ToolParameters(
                {
                    q: ToolParameterProperty.string(
                        "The SQL query to run, e.g. select * from stream where @Level = 'Error'"
                    ),
                    range_start: ToolParameterProperty.string(
                        'ISO 8601 start of the query range (inclusive).'
                    ),
                    range_end: ToolParameterProperty.string(
                        'ISO 8601 end of the query range (exclusive).'
                    ),
                    signal: ToolParameterProperty.string(
                        'Signal id to restrict the query to events in that signal.'
                    ),
                    timeout_ms: ToolParameterProperty.integer('Query timeout in milliseconds.')
                },
                ['q']
            )
        );
    }

    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const errors: string[] = [];
        if (typeof args.q !== 'string' || args.q.trim() === '') {
            errors.push('q must be a non-empty string');
        }
        if (args.signal !== undefined && typeof args.signal !== 'string') {
            errors.push('signal must be a string');
        }
        if (
            args.timeout_ms !== undefined &&
            (typeof args.timeout_ms !== 'number' ||
                !Number.isInteger(args.timeout_ms) ||
                args.timeout_ms < 1)
        ) {
            errors.push('timeout_ms must be a positive integer');
        }
        const rangeStart = parseIsoDate(args.range_start, 'range_start', errors);
        const rangeEnd = parseIsoDate(args.range_end, 'range_end', errors);
        if (errors.length > 0) {
            return { result: errors.join('\n'), status: ResultStatus.Error };
        }

        const options: DataQueryOptions = { q: args.q as string };
        if (rangeStart !== undefined) options.rangeStartUtc = rangeStart;
        if (rangeEnd !== undefined) options.rangeEndUtc = rangeEnd;
        if (typeof args.signal === 'string') options.signal = args.signal;
        if (typeof args.timeout_ms === 'number') options.timeoutMs = args.timeout_ms;

        try {
            const csv = await this.client.data.queryCsv(options);
            return { result: formatQueryResult(csv), status: ResultStatus.Success };
        } catch (error) {
            return {
                result: `Seq query failed: ${(error as Error).message}`,
                status: ResultStatus.Error
            };
        }
    }
}

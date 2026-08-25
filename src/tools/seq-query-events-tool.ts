import {
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import type { PartialToolResult } from '@johannes.latzel/llm-chat';
import { SeqClient, type EventQueryOptions } from '@johannes.latzel/seq-client';
import { formatEvents, parseIsoDate } from '../lib/format.js';

/** Tool that queries Seq for events matching an optional filter expression. */
export class SeqQueryEventsTool extends Tool {
    /**
     * @param client - A configured `SeqClient`.
     */
    constructor(private readonly client: SeqClient) {
        super(
            'seq_query_events',
            'Queries Seq for events matching an optional filter and returns each event timestamp, level, rendered message, and flattened properties.',
            new ToolParameters(
                {
                    filter: ToolParameterProperty.string(
                        "Seq filter expression, e.g. @Level = 'Error'. String literals must use single quotes."
                    ),
                    signal: ToolParameterProperty.string(
                        'Signal id to restrict the query to events in that signal.'
                    ),
                    count: ToolParameterProperty.integer(
                        'Maximum number of events to return (default 30).'
                    ),
                    render: ToolParameterProperty.boolean(
                        'Render message templates to plain text.'
                    ),
                    from_date: ToolParameterProperty.string(
                        'ISO 8601 start timestamp (inclusive).'
                    ),
                    to_date: ToolParameterProperty.string('ISO 8601 end timestamp (exclusive).')
                },
                []
            )
        );
    }

    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        const errors: string[] = [];
        if (args.filter !== undefined && typeof args.filter !== 'string') {
            errors.push('filter must be a string');
        }
        if (args.signal !== undefined && typeof args.signal !== 'string') {
            errors.push('signal must be a string');
        }
        if (
            args.count !== undefined &&
            (typeof args.count !== 'number' || !Number.isInteger(args.count) || args.count < 1)
        ) {
            errors.push('count must be a positive integer');
        }
        if (args.render !== undefined && typeof args.render !== 'boolean') {
            errors.push('render must be a boolean');
        }
        const fromDate = parseIsoDate(args.from_date, 'from_date', errors);
        const toDate = parseIsoDate(args.to_date, 'to_date', errors);
        if (errors.length > 0) {
            return { result: errors.join('\n'), status: ResultStatus.Error };
        }

        const options: EventQueryOptions = {};
        if (typeof args.filter === 'string') options.filter = args.filter;
        if (typeof args.signal === 'string') options.signal = args.signal;
        if (typeof args.count === 'number') options.count = args.count;
        if (args.render === true) options.render = true;
        if (fromDate !== undefined) options.fromDate = fromDate;
        if (toDate !== undefined) options.toDate = toDate;

        try {
            const events = await this.client.events.query(options);
            return { result: formatEvents(events), status: ResultStatus.Success };
        } catch (error) {
            return {
                result: `Seq query failed: ${(error as Error).message}`,
                status: ResultStatus.Error
            };
        }
    }
}

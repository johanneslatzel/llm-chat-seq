import {
    ResultStatus,
    Tool,
    ToolParameters,
    ToolParameterProperty
} from '@johannes.latzel/llm-chat';
import type { PartialToolResult } from '@johannes.latzel/llm-chat';
import { SeqClient, type SignalListOptions } from '@johannes.latzel/seq-client';
import { formatSignals } from '../lib/format.js';

/** Tool that lists the signals defined in Seq with their id, description, and filter expressions. */
export class SeqListSignalsTool extends Tool {
    /**
     * @param client - A configured `SeqClient`.
     */
    constructor(private readonly client: SeqClient) {
        super(
            'seq_list_signals',
            'Lists the signals defined in Seq with their id, description, and filter expressions so they can be referenced by seq_query_events or seq_run_query.',
            new ToolParameters(
                {
                    shared: ToolParameterProperty.boolean(
                        'List only signals shared with other users.'
                    ),
                    owner_id: ToolParameterProperty.string(
                        'List only signals owned by the given user id.'
                    )
                },
                []
            )
        );
    }

    protected async onExecute(args: Record<string, unknown>): Promise<PartialToolResult> {
        if (args.shared !== undefined && typeof args.shared !== 'boolean') {
            return { result: 'shared must be a boolean', status: ResultStatus.Error };
        }
        if (args.owner_id !== undefined && typeof args.owner_id !== 'string') {
            return { result: 'owner_id must be a string', status: ResultStatus.Error };
        }

        const options: SignalListOptions = {};
        if (args.shared === true || args.owner_id === undefined) {
            options.shared = true;
        }
        if (typeof args.owner_id === 'string') {
            options.ownerId = args.owner_id;
        }

        try {
            const signals = await this.client.signals.list(options);
            return { result: formatSignals(signals), status: ResultStatus.Success };
        } catch (error) {
            return {
                result: `Seq query failed: ${(error as Error).message}`,
                status: ResultStatus.Error
            };
        }
    }
}

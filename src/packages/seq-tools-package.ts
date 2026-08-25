import { ToolPackage } from '@johannes.latzel/llm-chat';
import type { SeqClient } from '@johannes.latzel/seq-client';
import { SeqQueryEventsTool } from '../tools/seq-query-events-tool.js';
import { SeqRunQueryTool } from '../tools/seq-run-query-tool.js';
import { SeqListSignalsTool } from '../tools/seq-list-signals-tool.js';

/** Tool package bundling `seq_list_signals`, `seq_query_events`, and `seq_run_query`. */
export class SeqToolsPackage extends ToolPackage {
    /**
     * @param client - A configured `SeqClient` shared by all three tools.
     */
    constructor(client: SeqClient) {
        super([
            new SeqQueryEventsTool(client),
            new SeqRunQueryTool(client),
            new SeqListSignalsTool(client)
        ]);
    }
}

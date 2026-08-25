import { describe, it, expect } from 'vitest';
import { SeqClient } from '@johannes.latzel/seq-client';
import { SeqToolsPackage } from '../../src/packages/seq-tools-package.js';

describe('SeqToolsPackage', () => {
    it('bundles the three seq tools', () => {
        const pkg = new SeqToolsPackage(new SeqClient({ url: 'http://seq.test' }));
        const names = pkg
            .tools()
            .map((t) => t.name)
            .sort();
        expect(names).toEqual(['seq_list_signals', 'seq_query_events', 'seq_run_query']);
    });
});

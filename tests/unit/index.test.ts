import { describe, it, expect } from 'vitest';
import {
    SeqConfiguration,
    createSeqClient,
    SeqToolsPackage,
    SeqQueryEventsTool,
    SeqRunQueryTool,
    SeqListSignalsTool
} from '../../src/index.js';

describe('public exports', () => {
    it('exposes the configuration and client factory', () => {
        expect(SeqConfiguration).toBeTypeOf('function');
        expect(createSeqClient).toBeTypeOf('function');
    });

    it('exposes the package and tool classes', () => {
        expect(SeqToolsPackage).toBeTypeOf('function');
        expect(SeqQueryEventsTool).toBeTypeOf('function');
        expect(SeqRunQueryTool).toBeTypeOf('function');
        expect(SeqListSignalsTool).toBeTypeOf('function');
    });
});

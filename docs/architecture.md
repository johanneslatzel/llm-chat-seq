# Architecture

## Design goal

Thin tool layer over the typed `@johannes.latzel/seq-client`. The package adds no HTTP logic; it
turns model-facing tool arguments into seq-client calls and formats the results for the LLM.

## Tool layer

Each tool extends the llm-chat `Tool` base class and takes a `SeqClient` from
`@johannes.latzel/seq-client`. `onExecute` validates the JSON-serializable arguments defensively,
maps them to the seq-client option surface, and formats the result.

## Configuration

`SeqConfiguration` resolves defaults from `LLM_CHAT_SEQ_*` environment variables, with constructor
arguments taking precedence. `createSeqClient` builds a `SeqClient`, throwing a clear error when no
url is configured.

## Integration tests

The `tests/integration/` suite exercises the real HTTP path against an in-process mock Seq server,
so `npm run test:integration` needs no running Seq instance. Set `SEQ_TEST_URL` to run against a
real server instead. The suite is excluded from `npm run verify`.

# Quick Start

## Prerequisites

- Node.js >= 20.9
- A reachable Seq server (default `http://localhost:5341`).

## Installation

```bash
npm install @johannes.latzel/llm-chat-seq
```

## Configure

```ts
import { SeqConfiguration } from '@johannes.latzel/llm-chat-seq';

const config = new SeqConfiguration(
    process.env.LLM_CHAT_SEQ_URL ?? 'http://localhost:5341',
    process.env.LLM_CHAT_SEQ_API_KEY
);
```

`SeqConfiguration` reads `LLM_CHAT_SEQ_URL`, `LLM_CHAT_SEQ_API_KEY`, and
`LLM_CHAT_SEQ_TIMEOUT_MS` by default. Constructor arguments win over the environment.

## Build the package

```ts
import { SeqConfiguration, createSeqClient, SeqToolsPackage } from '@johannes.latzel/llm-chat-seq';

const client = createSeqClient(new SeqConfiguration());
const pkg = new SeqToolsPackage(client);
const [queryEvents, runQuery, listSignals] = pkg.tools();
```

## List signals

```ts
const [signals] = await listSignals.execute({});
console.log(signals.result);
```

## Query events

```ts
const [events] = await queryEvents.execute({
    filter: "@Level = 'Error'",
    count: 20,
    render: true,
    from_date: new Date(Date.now() - 3600_000).toISOString()
});
console.log(events.result);
```

Seq filter string literals use single quotes, e.g. `@Level = 'Error'`. Use `seq_list_signals` to
discover saved signal filters, then pass the signal id to `seq_query_events` or `seq_run_query` to
reuse them.

## Run a SQL query

```ts
const [rows] = await runQuery.execute({
    q: "select @Timestamp, @Level from stream where @Level = 'Error'"
});
console.log(rows.result);
```

## Full API

See [API Reference](api-reference.md) for every tool and option.

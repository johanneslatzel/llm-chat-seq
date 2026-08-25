# API Reference

## `SeqConfiguration`

```ts
import { SeqConfiguration } from '@johannes.latzel/llm-chat-seq';

const config = new SeqConfiguration(url?, apiKey?, timeoutMs?);
```

Reads defaults from the environment when arguments are omitted.

| Field       | Env var                   | Default | Description                                                               |
| ----------- | ------------------------- | ------- | ------------------------------------------------------------------------- |
| `url`       | `LLM_CHAT_SEQ_URL`        | —       | Base URL of the Seq server. Required to build a client.                   |
| `apiKey`    | `LLM_CHAT_SEQ_API_KEY`    | `''`    | Sent as the `X-Seq-ApiKey` header. An empty string means unauthenticated. |
| `timeoutMs` | `LLM_CHAT_SEQ_TIMEOUT_MS` | `10000` | Per-request timeout in milliseconds.                                      |

## `createSeqClient`

```ts
import { createSeqClient } from '@johannes.latzel/llm-chat-seq';

const client = createSeqClient(config);
```

Builds a `@johannes.latzel/seq-client` `SeqClient` from a `SeqConfiguration`. Throws when the url
is not configured.

## `SeqClient`

The `SeqClient` type from `@johannes.latzel/seq-client`, re-exported for typing tool instances and
package constructors.

## `SeqToolsPackage`

```ts
import { SeqToolsPackage } from '@johannes.latzel/llm-chat-seq';

const pkg = new SeqToolsPackage(client);
pkg.tools(); // [seq_query_events, seq_run_query, seq_list_signals]
```

## `seq_query_events`

Implemented by the `SeqQueryEventsTool` class. Queries events matching an optional filter. Returns
each event timestamp, level, rendered message, and flattened properties.

| Option      | Type    | Description                                               |
| ----------- | ------- | --------------------------------------------------------- |
| `filter`    | string  | Seq filter expression. String literals use single quotes. |
| `signal`    | string  | Signal id to restrict the query.                          |
| `count`     | integer | Max events (default 30).                                  |
| `render`    | boolean | Resolve message templates to plain text.                  |
| `from_date` | string  | ISO 8601 start timestamp (inclusive).                     |
| `to_date`   | string  | ISO 8601 end timestamp (exclusive).                       |

## `seq_run_query`

Implemented by the `SeqRunQueryTool` class. Runs a SQL query and returns the rows as CSV.

| Option        | Type    | Description                                    |
| ------------- | ------- | ---------------------------------------------- |
| `q`           | string  | The SQL query (required).                      |
| `range_start` | string  | ISO 8601 start of the query range (inclusive). |
| `range_end`   | string  | ISO 8601 end of the query range (exclusive).   |
| `signal`      | string  | Signal id to restrict the query.               |
| `timeout_ms`  | integer | Query timeout in milliseconds.                 |

## `seq_list_signals`

Implemented by the `SeqListSignalsTool` class. Lists signals with title, id, description, and
filter expressions.

| Option     | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| `shared`   | boolean | List only shared signals.                     |
| `owner_id` | string  | List only signals owned by the given user id. |

## Errors

Invalid arguments produce an error result. Request failures (for example a `SeqApiError` from the
server) produce an error result with a readable message; they never throw out of the tool.

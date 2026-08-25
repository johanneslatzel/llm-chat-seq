# Overview

`@johannes.latzel/llm-chat-seq` gives an LLM agent tools to query a
[Seq](https://datalust.co/seq) event store: list signals, query events, and run SQL queries. It
builds on the typed `@johannes.latzel/seq-client`.

The package bundles three tools:

| Tool               | Purpose                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `seq_query_events` | Query events with a Seq filter expression; returns timestamps, levels, rendered messages, and flattened properties. |
| `seq_run_query`    | Run a SQL query and return the rows as CSV.                                                                         |
| `seq_list_signals` | List signals with their id, description, and filter expressions so the agent can reference them by id.              |

The tools are built on the llm-chat `Tool`/`ToolPackage` abstraction and plug into any
`ToolSuite`-based runtime.

## Navigation

- [Quick Start](quickstart.md)
- [API Reference](api-reference.md)
- [Architecture](architecture.md)
- [Environment Variables](env.md)

## License

MIT

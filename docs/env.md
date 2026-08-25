# Environment Variables

| Variable                  | Required | Default | Description                                             |
| ------------------------- | -------- | ------- | ------------------------------------------------------- |
| `LLM_CHAT_SEQ_URL`        | yes      | —       | Base URL of the Seq server. Required to build a client. |
| `LLM_CHAT_SEQ_API_KEY`    | no       | `''`    | API key sent as the `X-Seq-ApiKey` header.              |
| `LLM_CHAT_SEQ_TIMEOUT_MS` | no       | `10000` | Per-request timeout in milliseconds.                    |

`SeqConfiguration` reads these at construction; constructor arguments win:

```ts
import { SeqConfiguration } from '@johannes.latzel/llm-chat-seq';

const config = new SeqConfiguration(); // all from env
const config2 = new SeqConfiguration(url, apiKey); // overrides win
```

An empty or whitespace `LLM_CHAT_SEQ_URL` is treated as unset, so `createSeqClient` throws until a
url is configured.

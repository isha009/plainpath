# PlainPath 🏠

**Know your tenant rights — grounded in real sources, never guessed.**

PlainPath is a multi-step reasoning agent that answers tenant-rights questions by
retrieving **official source documents**, reasoning over them in visible steps,
**citing every claim**, and — crucially — **refusing to answer when the sources
don't support it** instead of hallucinating legal advice.

> Built for the **Microsoft Agents League 2026** · 🧠 Reasoning Agents track · grounded with **Foundry IQ**.
>
> ⚠️ General information, **not legal advice**. Built on public sources only — no confidential information.

### 🎥 Demo

**Watch the 2-minute demo:** https://youtu.be/qWtn-JTKDuc

---

## Why it's different

Most "AI legal helpers" confidently make things up. For high-stakes questions
("can my landlord evict me by changing the locks?") a confident wrong answer is
worse than no answer. PlainPath inverts the default:

- **Grounded-or-refuse.** Every claim is tied to a retrieved source passage. If
  nothing clears the grounding threshold, the agent **declines and points you to
  legal aid** — enforced by the agent itself, not just the model.
- **Shows its reasoning.** A live 4-stage loop (plan → search → reason → decide)
  streams to the screen, so you can see *why* it answered or declined.
- **Cites everything.** Each statement carries a `[n]` marker linking to the
  source, with a per-answer "grounding meter."

## How it uses Foundry IQ

[Foundry IQ](https://learn.microsoft.com/azure/ai-foundry/) is Microsoft's
agentic knowledge-retrieval layer: it connects enterprise sources, enforces
permissions, and returns **cited, grounded passages** to reduce hallucination —
exactly the contract PlainPath's agent depends on.

The grounding layer is a single interface with two implementations:

| Implementation | When it runs | Purpose |
|---|---|---|
| `FoundryIQKnowledgeSource` | when `FOUNDRY_IQ_*` env vars are set | **Live** Foundry IQ agentic retrieval |
| `LocalKnowledgeSource` | otherwise (default) | Offline mock so the app runs with zero setup |

Because both honor the same `retrieve()` contract, **the agent can't tell which
one it's talking to** — you develop and demo offline, then light up real Foundry
IQ by filling in two environment variables. See [Going live](#going-live-with-foundry-iq).

## Architecture

```
Browser (accessible SPA)
  │  GET /api/ask?q=…   ← Server-Sent Events: one event per reasoning step
  ▼
Express server  (src/server.js)
  ▼
PlainPathAgent  (src/agent/agent.js)   ── visible 4-stage loop
  ├─ LLM client      (src/llm/)        ← Azure OpenAI (Foundry) │ OpenAI │ MockLLM
  └─ Knowledge source (src/grounding/) ← Foundry IQ (live) │ Local mock
                                          factories pick by env
```

The agent enforces **grounded-or-refuse** as a safety net independent of the
model: it drops any citation that wasn't actually retrieved and forces a refusal
when no passage clears the grounding threshold.

## Quick start (no accounts needed)

```bash
npm install
npm start
# open http://localhost:3000
```

Runs fully offline using the local mock of Foundry IQ and a deterministic mock
model. Try the example chips — including the out-of-scope one to watch it decline.

```bash
npm test     # 7 tests: retrieval, grounded answers, and the refusal guard
```

## Going live with Foundry IQ

1. Create an **Azure AI Foundry** project (Azure free account works).
2. Index the documents in [`data/sources/`](data/sources) as a knowledge source
   / Azure AI Search index named `tenant-rights`.
3. Deploy a chat model (e.g. `gpt-4o`) in the same project.
4. Copy `.env.example` → `.env` and fill in:
   ```ini
   FOUNDRY_IQ_ENDPOINT=https://<your-search>.search.windows.net
   FOUNDRY_IQ_API_KEY=<key>
   AZURE_OPENAI_ENDPOINT=https://<your-foundry>.openai.azure.com
   AZURE_OPENAI_API_KEY=<key>
   AZURE_OPENAI_DEPLOYMENT=gpt-4o
   ```
5. `npm start`. The status line at the top of the app will switch from
   `mock` → **live**, confirming Foundry IQ is in the loop.

No application code changes — only environment variables.

## Accessibility

Semantic landmarks, labelled controls, full keyboard operation, visible focus
rings, an `aria-live` region for streamed reasoning steps, WCAG-AA contrast, and
`prefers-reduced-motion` support.

## Project layout

```
data/sources/      public tenant-rights documents (the grounding corpus)
src/grounding/     Foundry IQ + local retrieval, behind one interface
src/llm/           Azure OpenAI / OpenAI / deterministic mock, behind one interface
src/agent/         the 4-stage reasoning agent + prompts
src/server.js      Express + SSE streaming
public/            accessible single-page UI
tests/             node:test suite
docs/              design spec, demo script, submission text
```

## License

MIT

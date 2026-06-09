# PlainPath — Design & Spec

**Hackathon:** Microsoft Agents League 2026 · **Track:** 🧠 Reasoning Agents (Microsoft Foundry) · **IQ layer:** Foundry IQ
**Prize targets (stacked from one build):** Best Reasoning Agent · Best Use of IQ Tools · Hack for Good · Accessibility · (feeds Best Overall)
**Deadline:** 2026-06-14 · **Author:** Isha Singh Bhadauria

## One-liner
PlainPath is a grounded tenant-rights navigator. It answers high-stakes "what are my rights / what do I do" housing questions by reasoning in visible steps over **official source documents**, citing every claim, and **refusing to answer when the sources don't support it** — instead of hallucinating legal advice.

## Why this wins the rubric
| Criterion | Weight | How PlainPath scores |
|---|---|---|
| Accuracy & Relevance | 20% | Every answer is grounded in retrieved source passages; nothing ungrounded is asserted. |
| Reasoning & Multi-step | 20% | Agent runs a visible 4-stage loop: decompose → retrieve → reason → decide. Steps are streamed to the UI. |
| Reliability & Safety | 20% | Refuses when grounding is insufficient; out-of-scope detection; persistent "not legal advice" disclaimer; cites sources so claims are checkable. |
| Creativity & Originality | 15% | Refusal-as-a-feature + a "grounding meter" that shows *why* it answered or declined. |
| UX & Presentation | 15% | Clean, fully accessible (ARIA, keyboard, high-contrast) single-page app; plain-language output. |
| Community vote | 10% | Discord progress posts + vote ask. |

## Architecture
```
Browser (accessible SPA)
  │  POST /api/ask  (server-sent events: one event per reasoning step)
  ▼
Express server (src/server.js)
  ▼
Agent (src/agent/agent.js)  ── 4-stage reasoning loop
  ├─ LLM client (src/llm/*)         ← Azure OpenAI (via Foundry) | OpenAI | Mock
  └─ Knowledge source (src/grounding/*)
        ├─ FoundryIQKnowledgeSource  ← live Azure AI Foundry / Foundry IQ (agentic retrieval)
        └─ LocalKnowledgeSource      ← offline mock over data/sources/*.md (keyword/TF-IDF)
   Factory selects implementation from env vars.
```

### Reasoning loop (the 20% "multi-step" criterion, made visible)
1. **Decompose** — turn the user question into 1–3 retrieval queries + identify the jurisdiction if given.
2. **Retrieve** — query the knowledge source for each; collect passages with citations.
3. **Reason** — for each sub-point, decide whether retrieved passages support a claim; assemble a grounded chain ("you qualify for X because [S1]; you do NOT get Y because [S3]").
4. **Decide** — output one of: `answered` (with citations), `refused` (insufficient grounding / out of scope), or `partial` (some sub-points answered, others flagged). Always append the disclaimer.

Each stage emits an SSE event so the UI shows the agent "thinking."

### Grounding layer = the Foundry IQ integration
- **Interface:** `retrieve(query, { topK }) -> [{ id, sourceTitle, sourceUrl, text, score }]`.
- **`LocalKnowledgeSource`:** loads `data/sources/*.md`, splits into chunks with metadata, scores by term overlap. Zero external deps — runs offline so we make progress and demo before Azure is wired.
- **`FoundryIQKnowledgeSource`:** calls Foundry IQ agentic-retrieval / Azure AI Search knowledge endpoint when `FOUNDRY_IQ_ENDPOINT` + key are set. Returns cited, permissioned, grounded passages — the whole point of Foundry IQ.
- **Factory** (`src/grounding/index.js`): use Foundry IQ if env configured, else local. Same interface → swapping is invisible to the agent. This is what lets us build now and light up the real IQ later.

### LLM layer
- Interface: `complete({ system, messages, json }) -> string|object`.
- `AzureOpenAIClient` (preferred, runs inside Foundry project), `OpenAIClient` (fallback), `MockLLM` (deterministic structured reasoning from passages, so the flow is demoable with no keys).
- Factory selects by env.

## Data (source documents)
`data/sources/` holds plain-language summaries of **public** U.S. tenant-rights material, each with a real public source attribution (e.g., HUD Fair Housing Act overview, security-deposit norms, eviction-process basics, habitability/repair duties, retaliation protections). Educational summaries only — **no confidential info** (per hackathon disclaimer), and every doc + the UI carry a "not legal advice" disclaimer.

## Safety rules
- Refuse if top retrieval score < threshold or no passage covers the claim.
- Out-of-scope detector for non-tenancy questions.
- Never assert a number/deadline/right that isn't in a cited passage.
- Persistent disclaimer; "talk to a real attorney / local legal aid" pointer on refusal.

## Accessibility (for the Accessibility award)
Semantic HTML landmarks, labelled controls, full keyboard operability, visible focus, `aria-live` region for streamed steps, WCAG-AA contrast, respects `prefers-reduced-motion`.

## Tech
Node 24 + Express, vanilla HTML/CSS/JS frontend (no build step → reliable demo). Tests with Node's built-in `node:test`.

## Out of scope (YAGNI)
Auth, multi-user accounts, persistence/DB, multi-jurisdiction completeness, payments. One domain, one great demo.

## Deliverables
Public github.com repo · README (setup + Foundry IQ swap) · architecture diagram · 2-min demo video · submission text mapped to rubric.

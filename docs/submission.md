# PlainPath — Submission copy

Paste these into the hackathon project submission form. Edit the repo/video URLs once published.

## Project name
PlainPath — grounded tenant-rights navigator

## Track
🧠 Reasoning Agents (Microsoft Foundry)

## IQ layer used
**Foundry IQ** — agentic knowledge retrieval for grounded, cited answers.

## One-line summary
A multi-step reasoning agent that answers tenant-rights questions only from cited
sources via Foundry IQ — and refuses to guess when the sources don't cover it.

## Full description
PlainPath helps renters understand their rights without the risk of a confident
wrong answer. It runs a visible four-stage reasoning loop — plan, search, reason,
decide — retrieving official source documents through **Foundry IQ**, grounding
every statement in a citation, and showing a per-answer "grounding meter."

Its defining feature is **grounded-or-refuse**: if no retrieved source clears the
grounding threshold, the agent declines and points the user to legal aid instead
of hallucinating legal advice. This guard is enforced by the agent itself — it
drops any citation that wasn't actually retrieved and overrides the model if it
tries to answer ungrounded — so reliability doesn't depend on the model behaving.

The grounding layer is a clean interface with two implementations behind one
contract: live Foundry IQ, or an offline local retriever for zero-setup demos.
Swapping to production Foundry IQ is two environment variables, no code changes.

The interface is fully accessible (keyboard, screen-reader, WCAG-AA contrast,
reduced-motion) and writes in plain language, making legal information reachable
for people who need it most.

## How each rubric criterion is met
- **Accuracy & Relevance (20%)** — answers are grounded in retrieved Foundry IQ
  passages; nothing ungrounded is asserted.
- **Reasoning & Multi-step (20%)** — a visible 4-stage loop, streamed live to the UI.
- **Reliability & Safety (20%)** — agent-enforced grounded-or-refuse, citation
  validation, out-of-scope handling, persistent "not legal advice" disclaimer.
- **Creativity & Originality (15%)** — refusal-as-a-feature and a grounding meter
  that shows *why* it answered or declined.
- **UX & Presentation (15%)** — clean, fully accessible single-page app; plain language.
- **Community vote (10%)** — see Discord progress thread.

## Awards this project is eligible for
Best Reasoning Agent · Best Use of IQ Tools · Hack for Good · Accessibility Award.

## Repository
`<your public github.com URL>` (public, includes README + setup)

## Demo video
`<your video URL>`

## Disclaimer
PlainPath provides general information from public sources, not legal advice. It
contains no confidential information. Source documents are public summaries with
attribution in `data/sources/`.

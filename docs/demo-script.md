# PlainPath — 2-minute demo video script

**Goal:** land three judge takeaways — (1) visible multi-step reasoning, (2) Foundry IQ grounding with citations, (3) the refusal moment. Record at 1080p, screen + mic. Keep it under 2:30.

**Setup before recording:** run `npm start`, open `http://localhost:3000`, zoom browser to ~125%. If your Azure/Foundry IQ env is wired, even better — the status bar will read **live**; point at it.

---

### 0:00 — Hook (15s)
> "This is PlainPath. Ask it a tenant-rights question and it won't guess — it answers only from real sources, cites every line, and when it doesn't have a source, it *refuses*. Here's why that matters."

*(Point at the status bar.)*
> "Up here you can see it's grounded through Foundry IQ — Microsoft's agentic knowledge-retrieval layer."

### 0:15 — Grounded answer + visible reasoning (45s)
Click the chip: **"Can my landlord keep my deposit for normal wear and tear?"**
> "Watch the agent think in steps — it plans search queries, searches the knowledge base through Foundry IQ, reasons over what it found, then decides."

*(Let the steps stream. When the answer lands:)*
> "Every claim has a citation. This grounding meter shows how strongly the sources backed the answer. I can click any [1] and jump straight to the source it used."

*(Click a `[1]` marker → it scrolls/highlights the source.)*

### 1:00 — The refusal moment (the differentiator) (40s)
Type: **"Can I get a discount on my parking ticket?"**
> "This has nothing to do with tenant rights, and PlainPath has no source for it. A typical chatbot would invent an answer. Watch what this does."

*(Steps run, decision badge turns red: "Declined — not enough grounding.")*
> "It declines, explains why, and points to legal aid — instead of hallucinating legal advice. And this is enforced by the agent itself: even if the model tried to answer, the grounding guard drops any uncited claim. That's the Reliability and Safety story in one screen."

### 1:40 — Close (20s)
> "One interface swaps the local mock for live Foundry IQ with two environment variables — no code changes. It's fully accessible: keyboard-navigable, screen-reader friendly, high-contrast. PlainPath: grounded answers, visible reasoning, and the discipline to say 'I don't know.' Thanks for watching."

---

**Backup B-roll if a take runs short:** keyboard-only navigation (Tab through the chips and submit with Enter) to showcase accessibility, and the README architecture diagram.

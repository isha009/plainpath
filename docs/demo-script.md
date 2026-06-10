# PlainPath — demo video script (~2.5 min)

Plain instructions: **DO** = what to click/show on screen, **SAY** = what to say out loud.

**Before you hit record:**
- Server is running → open `http://localhost:3000`
- Open a second browser tab on your GitHub README: `https://github.com/isha009/plainpath`
- Zoom the browser to ~125% so text is readable on video
- Record at 1080p with screen + microphone

---

## 1. Hook — ~15 sec
**DO:** Show the PlainPath home page. Point your cursor at the status line near the top.
**SAY:**
> "This is PlainPath — an assistant for tenant rights. The difference: it never guesses. It answers only from real sources, cites every line, and when it has no source, it refuses. Up top you can see it's running live on Microsoft's Foundry IQ for retrieval and GPT-4o for reasoning."

## 2. A grounded answer, with visible reasoning — ~40 sec
**DO:** Click the example chip **"Can my landlord keep my deposit for normal wear and tear?"**
**SAY:**
> "Watch it think in steps — it plans what to search, searches the knowledge base through Foundry IQ, reasons over what it found, then decides."

**DO:** Let the reasoning steps appear one by one, then the answer.
**SAY:**
> "Here's the answer in plain language — and every claim has a citation. This grounding meter shows how strongly the sources backed it up."

## 3. Click a citation — ~10 sec
**DO:** Click a blue **[1]** or **[2]** marker inside the answer. It scrolls down and highlights the exact source.
**SAY:**
> "Click any citation and it jumps you straight to the source it used. Nothing is made up — everything traces back."

## 4. The refusal moment — the big one — ~35 sec
**DO:** In the question box, type **"Can I get a discount on my parking ticket?"** and submit.
**SAY:**
> "This has nothing to do with tenant rights, and PlainPath has no source for it. A normal chatbot would just invent an answer."

**DO:** Let it run. The badge turns red — "Declined — not enough grounding" — and the grounding meter stays at zero.
**SAY:**
> "Instead, it declines, explains why, and points you to legal aid. And this is enforced by the app itself — even if the AI model tried to answer, the grounding guard throws out anything that isn't backed by a real source. For high-stakes questions, refusing to guess is the safe, responsible thing to do."

## 5. Accessibility — keyboard-only — ~20 sec
**DO:** Put the mouse away. Press **Tab** a few times — you'll see the focus outline move across the question box and the example chips. Land on a chip and press **Enter** to run it.
**SAY:**
> "It's fully accessible too. I'm not touching the mouse — just Tab to move and Enter to ask. It's keyboard-navigable, screen-reader friendly, and high-contrast, so people who rely on assistive tech can use it just as easily."

## 6. How it's built — the README — ~25 sec
**DO:** Switch to your GitHub tab showing the README. Scroll slowly to the architecture diagram (the Browser → Server → Agent → Foundry IQ boxes).
**SAY:**
> "Here's the project on GitHub — public, with full setup instructions. The architecture is simple: a browser talks to the agent, which uses Foundry IQ for grounded retrieval and GPT-4o for reasoning. And the grounding layer sits behind one clean interface — so the exact same app runs offline on a local mock, or live on Foundry IQ, just by changing two settings. No code changes."

## 7. Close — ~15 sec
**DO:** Switch back to the PlainPath app on the answered question.
**SAY:**
> "That's PlainPath: grounded answers, reasoning you can watch, citations you can check — and the discipline to say 'I don't know.' Thanks for watching."

---

**Total: ~2 min 40 sec.** If you need to trim, cut section 3 (clicking the citation) first — it's the most expendable.

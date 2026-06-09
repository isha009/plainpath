import {
  DECOMPOSE_SYSTEM,
  decomposeUser,
  SYNTHESIZE_SYSTEM,
  synthesizeUser
} from './prompts.js';

const DISCLAIMER =
  'PlainPath gives general information from public sources — not legal advice. Laws vary by state and situation; confirm with your local housing authority, legal aid, or a tenant attorney.';

/**
 * The PlainPath reasoning agent.
 *
 * Runs a visible 4-stage loop and streams a step at each stage via `onStep`:
 *   1. decompose  2. retrieve  3. reason  4. decide
 *
 * Grounded-or-refuse is enforced by the AGENT, not just the model: if no
 * retrieved passage clears the grounding threshold, the agent refuses even if
 * the model tried to answer. Citations are validated against what was actually
 * retrieved, so a model cannot cite a source that was not used.
 */
export class PlainPathAgent {
  constructor({ knowledge, llm, topK = 4, minScore = 0.12 }) {
    this.knowledge = knowledge;
    this.llm = llm;
    this.topK = topK;
    this.minScore = minScore;
  }

  async ask(question, { onStep = () => {} } = {}) {
    const emit = (stage, detail, extra = {}) => onStep({ stage, detail, ...extra });

    // ---- Stage 1: decompose -------------------------------------------------
    emit('decompose', 'Breaking the question into search queries…');
    let queries = [question];
    try {
      const plan = await this.llm.complete({
        task: 'decompose',
        payload: { question },
        system: DECOMPOSE_SYSTEM,
        user: decomposeUser(question),
        json: true
      });
      if (Array.isArray(plan?.queries) && plan.queries.length) queries = plan.queries;
    } catch {
      // Fall back to the raw question if planning fails — never hard-fail here.
    }
    emit('decompose', `Planned ${queries.length} search quer${queries.length === 1 ? 'y' : 'ies'}.`, { queries });

    // ---- Stage 2: retrieve --------------------------------------------------
    emit('retrieve', `Searching the knowledge base (${this.knowledge.describe?.() || 'knowledge source'})…`);
    const byId = new Map();
    for (const q of queries) {
      const hits = await this.knowledge.retrieve(q, { topK: this.topK });
      for (const h of hits) {
        const existing = byId.get(h.id);
        if (!existing || h.score > existing.score) byId.set(h.id, h);
      }
    }
    const passages = [...byId.values()].sort((a, b) => b.score - a.score).slice(0, this.topK);
    const topScore = passages[0]?.score ?? 0;
    emit('retrieve', `Found ${passages.length} candidate passage(s); best grounding ${Math.round(topScore * 100)}%.`, {
      passages: passages.map((p) => ({ id: p.id, sourceTitle: p.sourceTitle, section: p.section, score: p.score }))
    });

    // ---- Stage 3 + 4: reason and decide ------------------------------------
    emit('reason', 'Checking which claims the sources actually support…');
    let result = await this.#synthesize(question, passages);

    // Agent-level safety net: enforce grounded-or-refuse regardless of model.
    result = this.#enforceGrounding(result, passages);

    for (const step of result.steps) emit(step.stage, step.detail);
    emit('decide', `Decision: ${result.decision.toUpperCase()}.`);

    // Resolve validated source numbers to full source objects for the UI.
    const citationObjs = result.citationNums.map((n) => {
      const p = passages[n - 1];
      return { n, id: p.id, sourceTitle: p.sourceTitle, section: p.section, sourceUrl: p.sourceUrl, score: p.score };
    });

    // The grounding meter reflects what was actually cited: the strongest cited
    // source, or 0 when the agent declined to answer.
    const groundingScore = citationObjs.length ? Math.max(...citationObjs.map((c) => c.score)) : 0;

    return {
      decision: result.decision,
      answer: result.answer,
      citations: citationObjs,
      groundingScore,
      disclaimer: DISCLAIMER
    };
  }

  async #synthesize(question, passages) {
    try {
      const out = await this.llm.complete({
        task: 'synthesize',
        payload: { question, passages, minScore: this.minScore },
        system: SYNTHESIZE_SYSTEM,
        user: synthesizeUser(question, passages),
        json: true
      });
      return {
        decision: out.decision || 'refused',
        steps: Array.isArray(out.steps) ? out.steps : [],
        answer: out.answer || '',
        citations: Array.isArray(out.citations) ? out.citations : []
      };
    } catch (err) {
      return {
        decision: 'refused',
        steps: [{ stage: 'decide', detail: `Could not complete reasoning: ${err.message}` }],
        answer: 'Something went wrong while reasoning over the sources. Please try again.',
        citations: []
      };
    }
  }

  /**
   * Defense in depth: the agent — not the model — has the final say on whether
   * an answer is grounded. Citations are resolved by SOURCE NUMBER, taken from
   * the [n] markers actually present in the answer (with the model's citations
   * array as a fallback), so it is robust to however the model formats them.
   * Any number that doesn't map to a retrieved, above-threshold passage is
   * dropped, and a refusal is forced when nothing clears the threshold.
   */
  #enforceGrounding(result, passages) {
    const supported = new Set(
      passages.map((p, i) => (p.score >= this.minScore ? i + 1 : 0)).filter(Boolean)
    );

    const fromMarkers = [...String(result.answer).matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1]));
    const fromModel = (result.citations || [])
      .map((c) => Number(String(c).replace(/[^\d]/g, '')))
      .filter(Boolean);
    const citationNums = [...new Set([...fromMarkers, ...fromModel])]
      .filter((n) => supported.has(n))
      .sort((a, b) => a - b);

    if (supported.size === 0 || (result.decision !== 'refused' && citationNums.length === 0)) {
      return {
        decision: 'refused',
        steps: [
          ...result.steps,
          { stage: 'decide', detail: 'No retrieved source cleared the grounding threshold — refusing instead of guessing.' }
        ],
        answer:
          "I don't have a source that reliably covers this, so I won't guess. It may be outside the tenant-rights topics I have documents for, or too specific to your local law. For a dependable answer, contact your local legal aid office or tenant union.",
        citationNums: []
      };
    }
    return { ...result, citationNums };
  }
}

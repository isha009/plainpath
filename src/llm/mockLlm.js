/**
 * Deterministic, offline stand-in for a chat model.
 *
 * Real models (Azure OpenAI / OpenAI) read the `system` + `user` prompts the
 * agent builds. The mock instead reads the structured `task` + `payload` the
 * agent also passes, so it can produce a sensible, grounded, *deterministic*
 * result with no network and no API key. This keeps the whole reasoning flow
 * demoable offline; swapping in a real model is one env var.
 */
export class MockLLM {
  async complete({ task, payload }) {
    if (task === 'decompose') return this.#decompose(payload);
    if (task === 'synthesize') return this.#synthesize(payload);
    return { text: '' };
  }

  #decompose({ question }) {
    // Split a compound question ("X and Y?") into separate retrieval queries.
    const parts = question
      .replace(/\?+/g, '')
      .split(/\band\b|;|,| but /i)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);
    const queries = parts.length > 1 ? parts : [question.trim()];
    return { queries: queries.slice(0, 3) };
  }

  #synthesize({ question, passages, minScore }) {
    const supported = passages.filter((p) => p.score >= minScore);

    if (supported.length === 0) {
      return {
        decision: 'refused',
        steps: [
          { stage: 'reason', detail: 'No source passage met the grounding threshold for this question.' },
          { stage: 'decide', detail: 'Refusing rather than guessing — answering ungrounded would risk giving wrong legal information.' }
        ],
        answer:
          "I don't have a source that covers this, so I won't guess. This may be outside tenant-rights topics I have documents for, or it may be too specific to your jurisdiction. For a reliable answer, contact your local legal aid office or tenant union.",
        citations: []
      };
    }

    const steps = supported.map((p, i) => ({
      stage: 'reason',
      detail: `Source [${i + 1}] "${p.sourceTitle} — ${p.section}" is relevant (grounding ${Math.round(p.score * 100)}%).`
    }));

    // Build a grounded answer from each cited passage and attach citation
    // markers. Strip the leading "Section. " prefix, then take a clean snippet.
    const bullets = supported.map((p, i) => {
      const body = p.section ? p.text.replace(`${p.section}.`, '').trim() : p.text;
      let snippet = body.slice(0, 220);
      const lastStop = snippet.lastIndexOf('. ');
      if (lastStop > 80) snippet = snippet.slice(0, lastStop + 1);
      return `• ${p.section}: ${snippet.trim()} [${i + 1}]`;
    });

    steps.push({
      stage: 'decide',
      detail: `Answering from ${supported.length} grounded source passage(s); every claim is cited.`
    });

    return {
      decision: 'answered',
      steps,
      answer:
        `Here is what the sources say about: "${question}"\n\n` +
        bullets.join('\n') +
        `\n\nThis is general information from public sources, not legal advice. Rules vary by state and situation — confirm with your local housing authority or a tenant attorney.`,
      citations: supported.map((p) => p.id)
    };
  }

  describe() {
    return 'MockLLM (deterministic, offline)';
  }
}

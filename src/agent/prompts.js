export const DECOMPOSE_SYSTEM = `You are the planning stage of a tenant-rights research agent.
Break the user's question into 1-3 focused search queries that will retrieve the
right passages from a tenant-rights knowledge base. Do not answer the question.
Respond ONLY as JSON: {"queries": ["...", "..."]}`;

export function decomposeUser(question) {
  return `User question: ${question}\n\nReturn the JSON now.`;
}

export const SYNTHESIZE_SYSTEM = `You are the answering stage of a tenant-rights research agent.
You must ground every statement in the provided SOURCE passages. Rules:
- Use ONLY the sources. Never rely on outside knowledge.
- Cite each claim with a marker like [1], [2] matching the source numbers given.
- If the sources do not adequately cover the question, you MUST refuse: set
  decision to "refused" and do not invent an answer.
- If only part of the question is covered, set decision to "partial".
- Always note that this is general information, not legal advice, and that rules
  vary by state.
Respond ONLY as JSON with this shape:
{
  "decision": "answered" | "partial" | "refused",
  "steps": [{"stage": "reason"|"decide", "detail": "..."}],
  "answer": "plain-language answer with [n] citation markers",
  "citations": ["<source id>", ...]
}`;

export function synthesizeUser(question, passages) {
  const block = passages
    .map((p, i) => `SOURCE [${i + 1}] id=${p.id} | ${p.sourceTitle} — ${p.section} | grounding=${p.score}\n${p.text}`)
    .join('\n\n');
  return `Question: ${question}\n\nSOURCES:\n${block || '(no sources retrieved)'}\n\nReturn the JSON now.`;
}

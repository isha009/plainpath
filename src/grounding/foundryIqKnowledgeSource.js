/**
 * Live Foundry IQ knowledge source.
 *
 * Foundry IQ provides *agentic knowledge retrieval*: you point it at one or more
 * enterprise sources (here, the tenant-rights corpus indexed in your Azure AI
 * Foundry project), and it returns permission-trimmed, grounded passages with
 * citations — exactly the shape PlainPath's agent expects.
 *
 * This client speaks to a Foundry IQ / Azure AI Search "knowledge" retrieval
 * endpoint. It is activated automatically by the factory in ./index.js when
 * FOUNDRY_IQ_ENDPOINT and FOUNDRY_IQ_API_KEY are present in the environment.
 *
 * The request/response shape below matches Azure AI Search's retrieval API. If
 * your Foundry IQ deployment exposes a different path, only this file changes —
 * the agent and the rest of the app are untouched.
 */
export class FoundryIQKnowledgeSource {
  constructor({ endpoint, apiKey, index }) {
    if (!endpoint || !apiKey) {
      throw new Error('FoundryIQKnowledgeSource requires endpoint and apiKey');
    }
    this.endpoint = endpoint.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.index = index || 'tenant-rights';
  }

  async retrieve(query, { topK = 4 } = {}) {
    const url = `${this.endpoint}/indexes/${encodeURIComponent(this.index)}/docs/search?api-version=2024-07-01`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.apiKey
      },
      body: JSON.stringify({
        search: query,
        top: topK,
        // Semantic ranking gives Foundry IQ-grade grounded relevance + captions.
        queryType: 'semantic',
        semanticConfiguration: 'default',
        captions: 'extractive',
        answers: 'extractive'
      })
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Foundry IQ retrieval failed (${res.status}): ${detail}`);
    }

    const data = await res.json();
    const docs = data.value || [];
    const max = docs.reduce((m, d) => Math.max(m, d['@search.rerankerScore'] ?? d['@search.score'] ?? 0), 0) || 1;

    return docs.map((d, i) => {
      const raw = d['@search.rerankerScore'] ?? d['@search.score'] ?? 0;
      const caption = d['@search.captions']?.[0]?.text;
      return {
        id: d.id || d.chunk_id || `foundry-${i}`,
        sourceTitle: d.title || d.sourceTitle || 'Foundry IQ source',
        section: d.section || '',
        sourceUrl: d.url || d.sourceUrl || '',
        text: caption || d.content || d.text || '',
        score: Number((raw / max).toFixed(3))
      };
    });
  }

  describe() {
    return `FoundryIQKnowledgeSource (live, index="${this.index}")`;
  }
}
